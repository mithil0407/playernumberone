-- Client photos in consultation-client-uploads were readable by anyone holding
-- the public anon key: the SELECT policy let any visitor list every token folder
-- and sign URLs for body photos.
--
-- The client upload page now lives at iconik.pro/upload/[token]. Its server
-- checks the token and hands out one-time signed upload URLs, then submits with
-- the service role. Old iconik-flow /upload links redirect there. So the public
-- storage policies and the token RPCs are no longer needed by anon users.
-- Apply only after both of those are live.
BEGIN;

DROP POLICY IF EXISTS "Token path objects can be signed" ON storage.objects;
DROP POLICY IF EXISTS "Upload clients can insert active token objects" ON storage.objects;

REVOKE ALL ON FUNCTION public.get_consultation_upload_link(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_consultation_upload_token_active(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_consultation_upload(text, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_consultation_upload_link(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_consultation_upload_token_active(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_consultation_upload(text, jsonb, jsonb) TO service_role;

COMMIT;
