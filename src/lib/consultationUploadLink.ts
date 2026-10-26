// The client upload page is iconik.pro/upload/[token]. Each consultation gets
// one private 48-character token from Postgres when it is created.
const DEFAULT_UPLOAD_URL_TEMPLATE = 'https://www.iconik.pro/upload/{token}';

export function consultationUploadUrl(token: unknown, template = process.env.CONSULTATION_UPLOAD_URL_TEMPLATE): string | null {
  if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) return null;
  const base = template?.trim() || DEFAULT_UPLOAD_URL_TEMPLATE;
  return base.includes('{token}')
    ? base.replace('{token}', token)
    : `${base.replace(/\/$/, '')}/${token}`;
}

export function uploadLinkMessage(clientName: string, uploadUrl: string) {
  const firstName = clientName.trim().split(/\s+/)[0] || 'there';
  return `Hi ${firstName}, thank you for your ICONIK consultation. Please upload your photos and measurements on this private link: ${uploadUrl}\n\nThis link is only for you, so please don't share it.`;
}

/** wa.me link for an Indian or international number; null if the number is unusable. */
export function uploadLinkWhatsAppUrl(phone: string, clientName: string, uploadUrl: string): string | null {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length < 11 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(uploadLinkMessage(clientName, uploadUrl))}`;
}
