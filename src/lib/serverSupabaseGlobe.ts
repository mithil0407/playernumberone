import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseGlobe } from '@/lib/supabaseGlobe';

const globeUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL_AU ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const globeServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY_AU ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const hasAdminConfig =
  !!globeUrl &&
  !!globeServiceRoleKey &&
  globeUrl !== 'https://placeholder.supabase.co';

let supabaseGlobeServer: SupabaseClient = supabaseGlobe;

if (hasAdminConfig) {
  try {
    supabaseGlobeServer = createClient(globeUrl, globeServiceRoleKey, {
      auth: { persistSession: false },
    });
    console.log('Globe server Supabase admin client created successfully');
  } catch (error) {
    console.error('Failed to create globe server admin client, falling back to anon client:', error);
    supabaseGlobeServer = supabaseGlobe;
  }
} else {
  console.warn('Globe admin Supabase env vars not configured, falling back to anon client');
}

export { supabaseGlobeServer };
