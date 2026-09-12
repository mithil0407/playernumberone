export function stylistWorkspaceDestination(slug: string, requested: string | null) {
  const base = `/stylist/${encodeURIComponent(slug)}`;
  const fallback = `${base}/dashboard`;
  if (!requested?.startsWith(`${base}/`) || /[\\\r\n]/.test(requested)) return fallback;
  try {
    const path = decodeURIComponent(requested.split(/[?#]/)[0]);
    if (/[\\\r\n]/.test(path) || path.split('/').some(part => part === '..' || part === '.')) return fallback;
    const url = new URL(requested, 'https://workspace.invalid');
    return url.pathname.startsWith(`${base}/`) ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch { return fallback; }
}
