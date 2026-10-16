// Runs the real Man classification for one intake and saves it locally (writes nothing to the database).
// node --experimental-strip-types --import ./scripts/node-test-hooks.mjs --env-file=.env.local scripts/men-recs/classify.ts <submission-id>
import { writeFileSync, mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { runClassification } from '@/lib/manReportGenerator';

const id = process.argv[2];
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data: submission, error } = await sb.from('man_intake_submissions').select('*').eq('id', id).single();
if (error) throw error;
const classification = await runClassification(submission as never);
mkdirSync('scripts/men-recs/out', { recursive: true });
writeFileSync(`scripts/men-recs/out/${id}.classification.json`, JSON.stringify({ submission, classification }, null, 2));
console.log(JSON.stringify({ colour: classification.colour, style: classification.style_brief, body: classification.body, profile: classification.recommendation_profile }, null, 1).slice(0, 5000));
