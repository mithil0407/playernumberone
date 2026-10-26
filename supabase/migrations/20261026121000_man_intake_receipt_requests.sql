-- Rate-limit paid-order receipt recovery without storing requested addresses.
CREATE TABLE IF NOT EXISTS public.man_intake_receipt_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash text NOT NULL,
  ip_hash text NOT NULL,
  requested_hour timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT man_receipt_email_hash_format CHECK (email_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT man_receipt_ip_hash_format CHECK (ip_hash ~ '^[a-f0-9]{64}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS man_intake_receipt_requests_email_hour
  ON public.man_intake_receipt_requests (email_hash, requested_hour);
CREATE INDEX IF NOT EXISTS man_intake_receipt_requests_ip_time
  ON public.man_intake_receipt_requests (ip_hash, created_at DESC);

ALTER TABLE public.man_intake_receipt_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.man_intake_receipt_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.man_intake_receipt_requests TO service_role;

-- Exact, case-insensitive lookup avoids wildcard matching on email addresses.
CREATE OR REPLACE FUNCTION public.man_paid_receipt_for_email(_email text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.razorpay_payment_id
  FROM public.orders o
  JOIN public.customers c ON c.id = o.customer_id
  WHERE lower(trim(c.email)) = lower(trim(_email))
    AND o.status IN ('paid', 'completed')
    AND o.product_type IN ('man_blueprint', 'man_blueprint_intl')
    AND o.razorpay_payment_id ~ '^pay_[A-Za-z0-9]+$'
  ORDER BY o.created_at DESC
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.man_paid_receipt_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.man_paid_receipt_for_email(text) TO service_role;
