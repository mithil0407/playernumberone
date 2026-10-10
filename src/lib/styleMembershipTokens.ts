// Tokens for the Style Membership funnel. Only hashes are stored.
// - lead token: proves a browser owns a quiz lead (result page, selfie, checkout).
// - member code: "ICM-XXXXXXXX", typed into WhatsApp by the "Open WhatsApp"
//   button so the agent can link the chat to the membership.

import { createHash, randomBytes } from 'node:crypto';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MEMBER_CODE = /\bICM-([A-HJ-NP-Z2-9]{8})\b/i;

export function createLeadToken() {
  return randomBytes(24).toString('base64url');
}

export function createMemberCode(bytes: Buffer = randomBytes(8)) {
  let code = 'ICM-';
  for (let index = 0; index < 8; index += 1) code += CODE_ALPHABET[bytes[index] % CODE_ALPHABET.length];
  return code;
}

export function parseMemberCode(text: string | null | undefined) {
  const match = (text ?? '').match(MEMBER_CODE);
  return match ? `ICM-${match[1].toUpperCase()}` : null;
}

export function hashToken(token: string) {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/** The message the "Open WhatsApp" button types for her. */
export function memberWhatsappText(code: string, firstName?: string | null) {
  return `Hi ICONIK! ${firstName ? `I'm ${firstName}, ` : ''}I just joined the Style Membership. My code is ${code}`;
}

export function memberWhatsappLink(businessNumber: string | null | undefined, code: string, firstName?: string | null) {
  const digits = (businessNumber ?? '').replace(/\D+/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(memberWhatsappText(code, firstName))}`;
}
