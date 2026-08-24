-- Add opt-in, send deduplication, and delivery tracking for transactional
-- WhatsApp confirmations on paid ICONIK Women consultation orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_whatsapp_confirmation_pending
  ON public.orders (whatsapp_confirmation_sent, whatsapp_opt_in)
  WHERE whatsapp_opt_in = true;

CREATE TABLE IF NOT EXISTS public.whatsapp_message_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT NOT NULL UNIQUE,
  message_type TEXT NOT NULL CHECK (message_type IN ('women_consultation_confirmation')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'sent', 'delivered', 'read', 'failed', 'deleted')),
  error_code TEXT,
  error_message TEXT,
  raw_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_order_id
  ON public.whatsapp_message_deliveries(order_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deliveries_status
  ON public.whatsapp_message_deliveries(status);

ALTER TABLE public.whatsapp_message_deliveries ENABLE ROW LEVEL SECURITY;

-- No public policies: server routes use the service-role client.
