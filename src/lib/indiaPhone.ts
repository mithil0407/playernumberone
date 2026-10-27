export function normalizeIndianWhatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D+/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith('0') && digits.length === 11) digits = `91${digits.slice(1)}`;
  return /^91[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function buildWhatsappUrl(phone: string, message: string): string | null {
  const normalized = normalizeIndianWhatsappNumber(phone);
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : null;
}

/**
 * Opens WhatsApp with the message typed in and lets the sender pick the chat.
 * Used when the number on file is not one we can address directly, e.g. a
 * client abroad who uses a foreign WhatsApp number.
 */
export function buildWhatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
