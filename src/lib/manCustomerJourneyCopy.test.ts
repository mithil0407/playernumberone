import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const readSource = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

const emailSource = readSource('src/lib/email.ts');
const manOrderEmail = emailSource.slice(
  emailSource.indexOf('function buildManEmailHtml'),
  emailSource.indexOf('// ── AU Order Confirmation Email')
);
const manIntakeReceivedEmail = emailSource.slice(
  emailSource.indexOf('export async function sendManIntakeReceivedEmail'),
  emailSource.indexOf('export async function sendGlobeIntakeReceivedEmail')
);

const manCustomerCopy = [
  readSource('src/app/man/page.tsx'),
  readSource('src/app/man/checkout/page.tsx'),
  readSource('src/app/man/intake/page.tsx'),
  readSource('src/components/ManReport.tsx'),
  manOrderEmail,
  manIntakeReceivedEmail,
].join('\n');

test('MAN Blueprint customer copy never promises a consultation', () => {
  assert.doesNotMatch(manCustomerCopy, /\bconsultation\b/i);
});

test('MAN Blueprint copy retains the human stylist review promise', () => {
  assert.match(readSource('src/app/man/page.tsx'), /reviewed by a human (?:ICONIK )?stylist/i);
  assert.match(readSource('src/app/man/checkout/page.tsx'), /reviewed by a human stylist/i);
  assert.match(manOrderEmail, /human stylist reviews it/i);
  assert.match(manIntakeReceivedEmail, /human stylist will review/i);
});
