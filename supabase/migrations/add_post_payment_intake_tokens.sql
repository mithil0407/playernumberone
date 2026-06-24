-- Gate post-payment intake pages behind paid, expiring one-time-style tokens.

CREATE TABLE IF NOT EXISTS public.post_payment_intake_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  source TEXT NOT NULL CHECK (source IN ('root_checkout', 'offer_2699_checkout')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_payment_intake_tokens_order_id
  ON public.post_payment_intake_tokens(order_id);

CREATE INDEX IF NOT EXISTS idx_post_payment_intake_tokens_razorpay_order_id
  ON public.post_payment_intake_tokens(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_post_payment_intake_tokens_expires_at
  ON public.post_payment_intake_tokens(expires_at);

ALTER TABLE public.post_payment_intake_tokens ENABLE ROW LEVEL SECURITY;

-- No public policies are required. Server API routes use the service-role client.
