-- Fix Supabase security advisor findings without changing app-level access.
-- App admin routes use service-role clients after checking ICONIK_INTERNAL_SECRET;
-- browser/client access should remain limited to the existing auth.uid() policies.

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- Preserve any existing Supabase Auth admin users, but move the claim into
-- app_metadata so end users cannot self-assign the role.
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE raw_user_meta_data ->> 'role' = 'admin'
  AND COALESCE(raw_app_meta_data ->> 'role', '') <> 'admin';

-- Tables exposed through public schema must have RLS enabled. The app writes
-- to these through trusted server routes/service role, so no broad anon policy
-- is added here.
ALTER TABLE public.uae_quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_scan_leads ENABLE ROW LEVEL SECURITY;

-- Iconik Club admin policies
DROP POLICY IF EXISTS "admin_full_access_fashion_items" ON public.fashion_items;
CREATE POLICY "admin_full_access_fashion_items"
  ON public.fashion_items FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "admin_full_access_client_profiles" ON public.client_profiles;
CREATE POLICY "admin_full_access_client_profiles"
  ON public.client_profiles FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "admin_full_access_outfit_sets" ON public.outfit_sets;
CREATE POLICY "admin_full_access_outfit_sets"
  ON public.outfit_sets FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "admin_full_access_outfit_items" ON public.outfit_items;
CREATE POLICY "admin_full_access_outfit_items"
  ON public.outfit_items FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "admin_full_access_outfit_feedback" ON public.outfit_feedback;
CREATE POLICY "admin_full_access_outfit_feedback"
  ON public.outfit_feedback FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Men Club admin policies
DROP POLICY IF EXISTS "men_admin_full_access_fashion_items" ON public.men_fashion_items;
CREATE POLICY "men_admin_full_access_fashion_items"
  ON public.men_fashion_items FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "men_admin_full_access_client_profiles" ON public.men_client_profiles;
CREATE POLICY "men_admin_full_access_client_profiles"
  ON public.men_client_profiles FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "men_admin_full_access_outfit_sets" ON public.men_outfit_sets;
CREATE POLICY "men_admin_full_access_outfit_sets"
  ON public.men_outfit_sets FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "men_admin_full_access_outfit_items" ON public.men_outfit_items;
CREATE POLICY "men_admin_full_access_outfit_items"
  ON public.men_outfit_items FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Men report funnel policies
DROP POLICY IF EXISTS "man_intake_admin_full_access" ON public.man_intake_submissions;
CREATE POLICY "man_intake_admin_full_access"
  ON public.man_intake_submissions FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "man_reports_admin_full_access" ON public.man_reports;
CREATE POLICY "man_reports_admin_full_access"
  ON public.man_reports FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Revenue policy
DROP POLICY IF EXISTS "admin_full_access_revenue_events" ON public.revenue_events;
CREATE POLICY "admin_full_access_revenue_events"
  ON public.revenue_events FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- AU policies
DROP POLICY IF EXISTS "au_admin_full_access_customers" ON public.au_customers;
CREATE POLICY "au_admin_full_access_customers"
  ON public.au_customers FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "au_admin_full_access_orders" ON public.au_orders;
CREATE POLICY "au_admin_full_access_orders"
  ON public.au_orders FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "au_admin_full_access_subscriptions" ON public.au_subscriptions;
CREATE POLICY "au_admin_full_access_subscriptions"
  ON public.au_subscriptions FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "au_admin_full_access_intake" ON public.au_intake_submissions;
CREATE POLICY "au_admin_full_access_intake"
  ON public.au_intake_submissions FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Globe policies
DROP POLICY IF EXISTS "globe_admin_full_access_customers" ON public.globe_customers;
CREATE POLICY "globe_admin_full_access_customers"
  ON public.globe_customers FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_admin_full_access_orders" ON public.globe_orders;
CREATE POLICY "globe_admin_full_access_orders"
  ON public.globe_orders FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_admin_full_access_subscriptions" ON public.globe_subscriptions;
CREATE POLICY "globe_admin_full_access_subscriptions"
  ON public.globe_subscriptions FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_admin_full_access_intake" ON public.globe_intake_submissions;
CREATE POLICY "globe_admin_full_access_intake"
  ON public.globe_intake_submissions FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_reports_admin_full_access" ON public.globe_reports;
CREATE POLICY "globe_reports_admin_full_access"
  ON public.globe_reports FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_reports_primary_admin_full_access" ON public.globe_reports;
CREATE POLICY "globe_reports_primary_admin_full_access"
  ON public.globe_reports FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_style_reports_admin_full_access" ON public.globe_style_reports;
CREATE POLICY "globe_style_reports_admin_full_access"
  ON public.globe_style_reports FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_report_jobs_admin_full_access" ON public.globe_report_jobs;
CREATE POLICY "globe_report_jobs_admin_full_access"
  ON public.globe_report_jobs FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "globe_report_assets_admin_full_access" ON public.globe_report_assets;
CREATE POLICY "globe_report_assets_admin_full_access"
  ON public.globe_report_assets FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Stylist blueprint and weekly edit policies
DROP POLICY IF EXISTS "stylist_blueprint_reports_admin_full_access" ON public.stylist_blueprint_reports;
CREATE POLICY "stylist_blueprint_reports_admin_full_access"
  ON public.stylist_blueprint_reports FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "style_edit_client_profiles_admin_full_access" ON public.style_edit_client_profiles;
CREATE POLICY "style_edit_client_profiles_admin_full_access"
  ON public.style_edit_client_profiles FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "style_edit_issues_admin_full_access" ON public.style_edit_issues;
CREATE POLICY "style_edit_issues_admin_full_access"
  ON public.style_edit_issues FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "style_edit_generation_events_admin_full_access" ON public.style_edit_generation_events;
CREATE POLICY "style_edit_generation_events_admin_full_access"
  ON public.style_edit_generation_events FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());
