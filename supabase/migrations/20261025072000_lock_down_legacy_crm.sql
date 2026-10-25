-- Legacy CRM writes and reads use server-side service-role routes. Keep the
-- existing admin-only stylists policy; remove anonymous catch-all access.
DROP POLICY IF EXISTS "Allow public insert on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public read on customers" ON public.customers;

DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;

DROP POLICY IF EXISTS "Anyone can delete consultations" ON public.consultations;
DROP POLICY IF EXISTS "Anyone can insert consultations" ON public.consultations;
DROP POLICY IF EXISTS "Anyone can update consultations" ON public.consultations;
DROP POLICY IF EXISTS "Anyone can view consultations" ON public.consultations;

DROP POLICY IF EXISTS "Anyone can delete eod_reports" ON public.eod_reports;
DROP POLICY IF EXISTS "Anyone can insert eod_reports" ON public.eod_reports;
DROP POLICY IF EXISTS "Anyone can update eod_reports" ON public.eod_reports;
DROP POLICY IF EXISTS "Anyone can view eod_reports" ON public.eod_reports;

DROP POLICY IF EXISTS "Anyone can delete intake drafts" ON public.consultation_intake_drafts;
DROP POLICY IF EXISTS "Anyone can insert intake drafts" ON public.consultation_intake_drafts;
DROP POLICY IF EXISTS "Anyone can update intake drafts" ON public.consultation_intake_drafts;
DROP POLICY IF EXISTS "Anyone can view intake drafts" ON public.consultation_intake_drafts;

DROP POLICY IF EXISTS "Anyone can view stylists" ON public.stylists;
