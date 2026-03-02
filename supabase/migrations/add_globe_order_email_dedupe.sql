-- Migration: add idempotent email tracking fields for globe order confirmations
-- Created: 2026-03-02

ALTER TABLE public.globe_orders
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false;

ALTER TABLE public.globe_orders
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_globe_orders_email_sent
  ON public.globe_orders (email_sent);
