// Local integration checks using temporary sessions and a disposable report.
// Never changes existing PINs, client reports, or sends messages.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
const origin = process.env.STYLIST_TEST_ORIGIN || 'http://localhost:3003';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
assert.ok(process.argv[2], 'Provide a complete source report ID');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const admin = `iconik_admin_auth=${process.env.ICONIK_INTERNAL_SECRET}`;
const sessions = [];
let consultationId, intakeId, reportId, imagePath, keep = false;
let checks = 0;
const pass = label => { checks++; console.log(`PASS ${label}`); };
async function request(path, cookie = '', method = 'GET', body) {
  const response = await fetch(`${origin}${path}`, { method, headers: { Cookie: cookie, ...(body instanceof FormData ? {} : {'Content-Type': 'application/json'}) }, body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body), redirect: 'manual' });
  const text = await response.text(); let parsed; try { parsed = JSON.parse(text); } catch { parsed = { error: text.slice(0, 120) }; }
  return { status: response.status, body: parsed, headers: response.headers };
}
function expect(result, code, label) { assert.equal(result.status, code, `${label}: ${JSON.stringify(result.body).slice(0, 400)}`); pass(label); return result.body; }
try {
  const {data: roster, error: rosterError} = await db.from('stylists').select('id,name,slug').eq('is_active', true).eq('workspace_enabled', true).order('name');
  assert.ifError(rosterError); assert.equal(roster.length, 10);
  const publicRoster = expect(await request('/api/stylist-workspace/auth/stylists'), 200, 'team login roster loads');
  assert.deepEqual(publicRoster.stylists, roster.map(({name,slug}) => ({name,slug}))); pass('roster includes all ten stylists without private fields');
  expect(await request('/api/stylist-workspace/queue?stylistSlug=jazz'), 401, 'anonymous admin preview denied');
  expect(await request('/api/stylist-workspace/auth/login', '', 'POST', {slug: 7, pin: 1111}), 401, 'malformed login rejected safely');
  for (const stylist of roster) {
    const token = randomBytes(32).toString('base64url');
    const {data, error} = await db.from('stylist_sessions').insert({stylist_id:stylist.id, token_hash:createHash('sha256').update(token).digest('hex'), user_agent:'Workspace automated QA', expires_at:new Date(Date.now()+600000).toISOString()}).select('id').single();
    assert.ifError(error); sessions.push({id:data.id, stylist, cookie:`iconik_stylist_workspace=${token}`});
    const other = roster.find(item => item.id !== stylist.id);
    const result = expect(await request(`/api/stylist-workspace/queue?bucket=all&limit=50&stylistSlug=${other.slug}`, sessions.at(-1).cookie), 200, `${stylist.name} workspace opens`);
    assert.equal(result.stylist.slug, stylist.slug); assert.ok(result.items.every(item => item.stylistId === stylist.id));
    pass(`${stylist.name} cannot change identity through the queue URL`);
  }
  const owner = sessions[0], outsider = sessions[1];
  const preview = expect(await request(`/api/stylist-workspace/queue?stylistSlug=${owner.stylist.slug}&bucket=all`, admin), 200, 'admin can preview an individual workspace');
  assert.equal(preview.stylist.slug, owner.stylist.slug);
  const {data:source,error:sourceError}=await db.from('stylist_blueprint_reports').select('report_data').eq('id',process.argv[2]).single(); assert.ifError(sourceError);
  assert.equal(source.report_data.pages.length,55);
  let serialized = JSON.stringify(source.report_data);
  for (const name of [source.report_data.client?.display_name, source.report_data.classification?.client?.name].filter(Boolean)) serialized=serialized.replaceAll(name,'Workspace QA Fixture');
  const fixture=JSON.parse(serialized); fixture.client.display_name='Workspace QA Fixture';
  const {data:c,error:ce}=await db.from('consultations').insert({stylist_id:owner.stylist.id,client_name:'Workspace QA Fixture',client_phone:'0000000000',status:'waiting_images'}).select('id').single(); assert.ifError(ce); consultationId=c.id;
  const {data:i,error:ie}=await db.from('stylist_intake_responses').insert({full_name:'Workspace QA Fixture',customer_email:'qa@example.invalid',intake_source:'india_consultation',photo_urls:{},country:'India',consultation_id:consultationId,assigned_stylist_id:owner.stylist.id}).select('id').single(); assert.ifError(ie); intakeId=i.id;
  const {data:r,error:re}=await db.from('stylist_blueprint_reports').insert({submission_id:intakeId,status:'in_review',report_data:fixture,section_approvals:{},image_urls:null,created_by_stylist_id:owner.stylist.id}).select('id').single(); assert.ifError(re); reportId=r.id;
  const path=`/api/stylist-blueprint/${reportId}`;
  expect(await request(path,owner.cookie),200,'assigned stylist can open their report');
  expect(await request(path,outsider.cookie),401,'other stylist cannot read the report');
  expect(await request(path,outsider.cookie,'PATCH',{page_approvals:{p1:true}}),401,'other stylist cannot edit the report');
  expect(await request(`${path}/outfit-options?page=16`,outsider.cookie),401,'other stylist cannot read outfit alternatives');
  expect(await request(`${path}/generate-images`,owner.cookie,'POST',{planOnly:true}),403,'AI image generation remains admin only');
  const outfits=fixture.pages.filter(page=>page.page_type==='outfit'); assert.ok(outfits.length);
  const pageNumber=outfits[0].page_number;
  const options=expect(await request(`${path}/outfit-options?page=${pageNumber}`,owner.cookie),200,'stylist can browse suitable alternative outfits');
  assert.ok(options.options.length,'fixture must have unused alternatives');
  let current=(await request(`${path}?fresh=1`,owner.cookie)).body.report;
  expect(await request(`${path}/outfit-options`,owner.cookie,'POST',{pageNumber,candidateId:options.options[0].id,expectedUpdatedAt:'stale'}),409,'stale outfit replacement is rejected');
  expect(await request(`${path}/outfit-options`,owner.cookie,'POST',{pageNumber,candidateId:'not-eligible',expectedUpdatedAt:current.updated_at}),409,'unavailable outfit replacement is rejected');
  expect(await request(`${path}/outfit-options`,owner.cookie,'POST',{pageNumber,candidateId:options.options[0].id,expectedUpdatedAt:current.updated_at}),200,'stylist can select a new outfit');
  let changed=(await request(`${path}?fresh=1`,owner.cookie)).body.report;
  assert.deepEqual(changed.report_data.pages.filter(p=>p.page_number!==pageNumber),current.report_data.pages.filter(p=>p.page_number!==pageNumber));
  assert.equal(changed.report_data.outfit_engine.selected_candidate_ids[0],options.options[0].id); pass('alternative changes only the selected outfit page');
  const image = await sharp({create:{width:64,height:64,channels:3,background:'#EDE5D2'}}).png().toBuffer();
  const form=new FormData(); form.set('slotKey','application.outfitFlatlays.0'); form.set('file',new Blob([image],{type:'image/png'}),'workspace-qa.png');
  expect(await request(`${path}/assets`,owner.cookie,'POST',form),200,'stylist can upload the replacement outfit image');
  const stored=await db.from('stylist_blueprint_reports').select('image_urls').eq('id',reportId).single(); assert.ifError(stored.error); imagePath=stored.data.image_urls.application.outfitFlatlays[0]; assert.ok(imagePath);
  current=(await request(`${path}?fresh=1`,owner.cookie)).body.report;
  let page=structuredClone(current.report_data.pages.find(p=>p.page_number===pageNumber)); page.title='QA saved outfit title';
  expect(await request(path,owner.cookie,'PATCH',{page,expectedRevision:current.revision,expectedUpdatedAt:current.updated_at}),200,'outfit wording saves');
  let storedCopy=await db.from('stylist_blueprint_reports').select('image_urls').eq('id',reportId).single(); assert.equal(storedCopy.data.image_urls.application.outfitFlatlays[0],imagePath); pass('wording-only edits preserve the image');
  current=(await request(`${path}?fresh=1`,owner.cookie)).body.report;
  page=structuredClone(current.report_data.pages.find(p=>p.page_number===pageNumber));
  const formula=page.blocks.find(block=>/formula/i.test(block.label||'')&&Array.isArray(block.items)); assert.ok(formula); formula.items[0].piece+=' with refined seam detail';
  const saved=expect(await request(path,owner.cookie,'PATCH',{page,expectedRevision:current.revision,expectedUpdatedAt:current.updated_at}),200,'garment edits save');
  assert.deepEqual(saved.invalidatedOutfitImages,[0]);
  storedCopy=await db.from('stylist_blueprint_reports').select('image_urls,section_approvals').eq('id',reportId).single(); assert.equal(storedCopy.data.image_urls.application.outfitFlatlays[0],null); assert.equal(storedCopy.data.section_approvals[`p${pageNumber}`],false); pass('changed garments clear the outdated image and approval');
  if(process.env.STYLIST_KEEP_QA_FIXTURE==='1') { await writeFile('/private/tmp/stylist-team-workspace-fixture.json',JSON.stringify({reportId,intakeId,consultationId,stylistSlug:owner.stylist.slug,imagePath}),{mode:0o600}); keep=true; console.log(`QA page: ${origin}/stylist/${owner.stylist.slug}/reports/${reportId}`); }
  console.log(`${checks} team workspace integration checks passed`);
} finally {
  if(sessions.length) { const {error}=await db.from('stylist_sessions').delete().in('id',sessions.map(s=>s.id)); assert.ifError(error); }
  if(!keep) {
    if(imagePath) { const {error}=await db.storage.from('stylist-blueprint-images').remove([imagePath]); assert.ifError(error); }
    if(intakeId) { const {error}=await db.from('stylist_intake_responses').delete().eq('id',intakeId).eq('full_name','Workspace QA Fixture'); assert.ifError(error); }
    if(consultationId) { const {error}=await db.from('consultations').delete().eq('id',consultationId).eq('client_name','Workspace QA Fixture'); assert.ifError(error); }
  }
}
