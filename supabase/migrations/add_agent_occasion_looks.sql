-- ICONIK Agent: occasion looks. Before an occasion (Diwali…), each Man client
-- with a delivered Blueprint gets one look made for him — a photo of him in an
-- outfit in his colours — on WhatsApp and by email. A stylist approves each
-- look before it goes out. When he likes it, the agent asks for his pincode and
-- size and finds the pieces at stores that deliver in time.
-- Run after add_iconik_agent_v3_free.sql.

CREATE TABLE IF NOT EXISTS public.agent_occasion_looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign text NOT NULL,
  report_id uuid NOT NULL REFERENCES public.man_reports(id) ON DELETE CASCADE,
  share_token text NOT NULL,
  phone text,
  email text,
  first_name text,
  agent_client_id uuid REFERENCES public.agent_clients(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',     -- queued for the worker to design and draw
    'generating',  -- the worker is on it
    'ready',       -- waiting for a stylist's approval
    'approved',    -- will go out with the next send
    'sent',
    'rejected',
    'failed'
  )),
  outfit text,           -- the full outfit, piece by piece, with colours
  hook text,             -- one line on why it suits him, used in the message
  image_path text,       -- in the man-edit-chat-images bucket
  image_url text,        -- signed, long-lived
  error text,
  attempts integer NOT NULL DEFAULT 0,
  generating_since timestamptz,
  whatsapp_channel text CHECK (whatsapp_channel IN ('template', 'in_window')),
  whatsapp_message_id text,
  whatsapp_error text,
  whatsapp_sent_at timestamptz,
  email_sent_at timestamptz,
  email_error text,
  responded_at timestamptz,
  response text,         -- 'love' | 'another' | 'reply'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign, report_id)
);

CREATE INDEX IF NOT EXISTS agent_occasion_looks_campaign_status_idx
  ON public.agent_occasion_looks(campaign, status);
CREATE INDEX IF NOT EXISTS agent_occasion_looks_client_idx
  ON public.agent_occasion_looks(agent_client_id, whatsapp_sent_at DESC);
CREATE INDEX IF NOT EXISTS agent_occasion_looks_phone_idx
  ON public.agent_occasion_looks(phone);

ALTER TABLE public.agent_occasion_looks ENABLE ROW LEVEL SECURITY;
