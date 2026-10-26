-- Staff management and token-listing functions must only run behind a trusted
-- server. Keep the token-scoped client upload functions available to clients.
BEGIN;

REVOKE ALL ON FUNCTION public.create_stylist_with_pin(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_stylist_pin(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_stylist_pin_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_stylist_pin(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_consultation_upload_links() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.list_consultation_upload_links_for_consultations(uuid[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_consultation_upload_link_by_consultation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dismiss_consultation_upload_notification(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_stylist_with_pin(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_stylist_pin(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_stylist_pin_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_stylist_pin(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_consultation_upload_links() TO service_role;
GRANT EXECUTE ON FUNCTION public.list_consultation_upload_links_for_consultations(uuid[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_consultation_upload_link_by_consultation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.dismiss_consultation_upload_notification(uuid) TO service_role;

COMMIT;
