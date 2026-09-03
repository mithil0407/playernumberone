import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { Upload } from 'tus-js-client';

const bucket = 'man-intake-photos';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceKey) {
  throw new Error('Missing Supabase smoke-test environment variables.');
}

const origin = new URL(supabaseUrl).origin;
const projectId = new URL(supabaseUrl).hostname.split('.')[0];
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const dimension = 512;
const payload = await sharp(randomBytes(dimension * dimension * 3), {
  raw: { width: dimension, height: dimension, channels: 3 },
}).png().toBuffer();
const uploadedPaths = [];

function tusUpload({ endpoint, path, token }) {
  return new Promise((resolve, reject) => {
    const upload = new Upload(payload, {
      endpoint,
      retryDelays: [0, 500, 1_000],
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: false,
      removeFingerprintOnSuccess: true,
      addRequestId: true,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'x-signature': token,
      },
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: 'image/png',
        cacheControl: '3600',
      },
      onError: reject,
      onSuccess: resolve,
    });
    upload.start();
  });
}

async function prepare(path) {
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token || !data?.signedUrl) {
    throw new Error(`Could not prepare smoke upload: ${error?.message || 'missing signed URL'}`);
  }
  return data;
}

async function verify(path) {
  const { data, error } = await admin.storage.from(bucket).info(path);
  if (error || !data) throw new Error(`Smoke object was not stored: ${error?.message || 'missing object'}`);
  if (data.size !== payload.length || data.contentType !== 'image/png') {
    throw new Error(`Smoke object metadata mismatch for ${path}.`);
  }
}

async function exerciseTus(label, endpoint) {
  const path = `public/man-intake-smoke/${randomUUID()}-${label}.png`;
  uploadedPaths.push(path);
  const signed = await prepare(path);
  const startedAt = Date.now();
  await tusUpload({ endpoint, path, token: signed.token });
  await verify(path);
  console.log(`${label}: ok (${Date.now() - startedAt}ms)`);
}

async function exerciseSignedUpload() {
  const path = `public/man-intake-smoke/${randomUUID()}-signed.png`;
  uploadedPaths.push(path);
  const signed = await prepare(path);
  const body = new FormData();
  body.append('cacheControl', '3600');
  body.append('', new Blob([payload], { type: 'image/png' }), 'smoke.png');
  const startedAt = Date.now();
  const response = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'x-upsert': 'false',
    },
    body,
  });
  if (!response.ok) throw new Error(`Signed upload failed with HTTP ${response.status}.`);
  await verify(path);
  console.log(`signed: ok (${Date.now() - startedAt}ms)`);
}

try {
  await exerciseTus('direct', `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`);
  await exerciseTus('project', `${origin}/storage/v1/upload/resumable`);
  await exerciseSignedUpload();
  console.log('All man intake upload routes are healthy.');
} finally {
  if (uploadedPaths.length > 0) {
    const { error } = await admin.storage.from(bucket).remove(uploadedPaths);
    if (error) console.error(`Smoke cleanup failed: ${error.message}`);
  }
}
