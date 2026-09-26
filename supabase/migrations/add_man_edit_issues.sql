-- ICONIK Man Edit issues: each monthly Edit is a man_reports row that points
-- back at the client's Blueprint, so the outfit image, shopping and review
-- tooling that already works on man_reports works on Edits unchanged.
-- Run after add_man_reports.sql and add_man_edit_subscription.sql.

ALTER TABLE public.man_reports
  ADD COLUMN IF NOT EXISTS report_kind text NOT NULL DEFAULT 'blueprint',
  ADD COLUMN IF NOT EXISTS parent_report_id uuid REFERENCES public.man_reports(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS edit_subscription_id uuid REFERENCES public.man_edit_subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edit_issue_number integer,
  ADD COLUMN IF NOT EXISTS edit_period_start date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'man_reports_report_kind_check') THEN
    ALTER TABLE public.man_reports
      ADD CONSTRAINT man_reports_report_kind_check CHECK (report_kind IN ('blueprint', 'edit'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'man_reports_edit_shape_check') THEN
    ALTER TABLE public.man_reports
      ADD CONSTRAINT man_reports_edit_shape_check CHECK (
        report_kind = 'blueprint'
        OR (parent_report_id IS NOT NULL AND edit_subscription_id IS NOT NULL AND edit_issue_number IS NOT NULL)
      );
  END IF;
END $$;

-- One row per issue number per subscription: the webhook, the cron sweep and
-- the admin button can all race to create the same issue safely.
CREATE UNIQUE INDEX IF NOT EXISTS man_reports_edit_issue_unique
  ON public.man_reports(edit_subscription_id, edit_issue_number)
  WHERE report_kind = 'edit';

CREATE INDEX IF NOT EXISTS man_reports_parent_report_id_idx
  ON public.man_reports(parent_report_id)
  WHERE parent_report_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS man_reports_report_kind_idx
  ON public.man_reports(report_kind);
