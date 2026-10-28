-- Studio pictures of the women's outfit library, and the curator stylist's
-- like/pass swipes on them. The outfit engine recommends only liked looks.
-- Server-only: reached through the stylist workspace API with the service role.

CREATE TABLE IF NOT EXISTS public.stylist_outfit_library_images (
  look_id text PRIMARY KEY,
  storage_path text NOT NULL,
  look_hash text NOT NULL,
  prompt_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stylist_outfit_library_images_look_id_format CHECK (look_id ~ '^(pinterest|ethnic-office)-[0-9]+[a-z]?$')
);

CREATE TABLE IF NOT EXISTS public.stylist_outfit_library_votes (
  stylist_id uuid NOT NULL REFERENCES public.stylists(id) ON DELETE CASCADE,
  look_id text NOT NULL,
  verdict text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stylist_id, look_id),
  CONSTRAINT stylist_outfit_library_votes_verdict CHECK (verdict IN ('like', 'dislike')),
  CONSTRAINT stylist_outfit_library_votes_look_id_format CHECK (look_id ~ '^(pinterest|ethnic-office)-[0-9]+[a-z]?$')
);

ALTER TABLE public.stylist_outfit_library_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stylist_outfit_library_votes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stylist_outfit_library_images FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.stylist_outfit_library_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stylist_outfit_library_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stylist_outfit_library_votes TO service_role;

-- Private bucket: pictures are served to signed-in stylists as signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('stylist-outfit-library', 'stylist-outfit-library', false, 5242880, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;
