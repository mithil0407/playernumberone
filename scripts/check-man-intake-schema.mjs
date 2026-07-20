import fs from 'node:fs';
import path from 'node:path';

const requiredColumns = [
  'customer_email',
  'customer_phone',
  'photo_fullbody_url',
  'photo_headshot_url',
  'photo_side_profile_url',
  'primary_goal',
  'style_relationship',
  'dressing_context',
  'location_tier',
  'height_category',
  'body_shape',
  'fat_storage_zone',
  'highlight_zone',
  'minimise_zone',
  'fit_preference',
  'wardrobe_composition',
  'skin_tone',
  'vein_undertone',
  'white_test',
  'hair_colour',
  'eye_colour',
  'derived_colour_season',
  'face_shape',
  'facial_feature_type',
  'primary_style_goal',
  'branch_answer',
  'style_tribes',
  'style_pole_structure',
  'style_pole_expression',
  'style_pole_tone',
  'style_pole_register',
  'style_blocker',
  'style_anti_pref',
  'style_anti_pref_note',
  'free_text_note',
];

function localEnvironment() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};

  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .flatMap((line) => {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!match) return [];
        return [[match[1], match[2].trim().replace(/^['"]|['"]$/g, '')]];
      }),
  );
}

const local = localEnvironment();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || local.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const endpoint = new URL('/rest/v1/man_intake_submissions', supabaseUrl);
endpoint.searchParams.set('select', requiredColumns.join(','));
endpoint.searchParams.set('limit', '0');

let response;
try {
  response = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
} catch (error) {
  console.error(`Man intake schema check could not reach Supabase: ${error instanceof Error ? error.message : 'Network error'}`);
  process.exit(1);
}

if (!response.ok) {
  const body = await response.json().catch(() => ({}));
  console.error(`Man intake schema check failed (${response.status}): ${body.message || 'Unknown schema error'}`);
  process.exit(1);
}

console.log(`Man intake schema check passed for ${new URL(supabaseUrl).host} (${requiredColumns.length} required columns).`);
