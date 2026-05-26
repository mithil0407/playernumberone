-- Style Scan lead capture table (free ICONIK Style Score funnel)
CREATE TABLE public.style_scan_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  style_struggle text,
  body_shape text,
  undertone text,
  aesthetic text,
  dressing_context text,
  photo_url text,
  style_score integer,
  colour_direction text,
  silhouette_direction text,
  mood_keywords text,
  mood_colours text,
  whats_missing text,
  blueprint_cta_clicked boolean DEFAULT false,
  checkout_started boolean DEFAULT false,
  purchased boolean DEFAULT false,
  source text DEFAULT 'style_scan',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text,
  attribution_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT style_scan_leads_pkey PRIMARY KEY (id)
);

CREATE INDEX style_scan_leads_email_idx ON public.style_scan_leads(email);
CREATE INDEX style_scan_leads_created_at_idx ON public.style_scan_leads(created_at DESC);

-- Stylist funnel orders ($149 Blueprint)
CREATE TABLE public.stylist_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid,
  customer_email text NOT NULL,
  customer_name text,
  customer_phone text,
  amount numeric,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])),
  razorpay_order_id text,
  razorpay_payment_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text,
  attribution_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stylist_orders_pkey PRIMARY KEY (id),
  CONSTRAINT stylist_orders_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.style_scan_leads(id)
);

CREATE INDEX stylist_orders_email_idx ON public.stylist_orders(customer_email);
CREATE INDEX stylist_orders_razorpay_order_id_idx ON public.stylist_orders(razorpay_order_id);
