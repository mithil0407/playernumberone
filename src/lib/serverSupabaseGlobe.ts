import 'server-only';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';

const supabaseGlobeServer = createSupabaseAdminServerClient();

export { supabaseGlobeServer };
