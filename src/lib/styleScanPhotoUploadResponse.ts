export async function readStyleScanPhotoUploadResponse(res: Response): Promise<string> {
  const headerUrl = res.headers.get('x-iconik-upload-url')?.trim() || '';
  const responseText = await res.text();
  let responseBody: { url?: unknown; error?: unknown } = {};

  if (responseText.trim()) {
    try {
      responseBody = JSON.parse(responseText) as { url?: unknown; error?: unknown };
    } catch {
      if (!res.ok || !headerUrl) {
        throw new Error('The photo server returned an unreadable response. Please try this photo again.');
      }
    }
  }

  const bodyUrl = typeof responseBody.url === 'string' ? responseBody.url.trim() : '';
  const confirmedUrl = bodyUrl || headerUrl;
  if (!res.ok || !confirmedUrl) {
    const serverError = typeof responseBody.error === 'string' ? responseBody.error.trim() : '';
    throw new Error(serverError || 'Photo upload finished without confirmation. Please try this photo again.');
  }

  return confirmedUrl;
}
