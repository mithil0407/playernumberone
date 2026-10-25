CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_hash text NOT NULL,
  ip_hash text NOT NULL,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_account_window_idx
  ON public.admin_login_attempts (account_hash, created_at DESC)
  WHERE succeeded = false;

CREATE INDEX IF NOT EXISTS admin_login_attempts_ip_window_idx
  ON public.admin_login_attempts (ip_hash, created_at DESC)
  WHERE succeeded = false;

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_login_attempts FROM anon, authenticated;
