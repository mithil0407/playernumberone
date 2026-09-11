/** Provider deadlines are retryable, unlike authentication and invalid input. */
export function isRetryableStylistGenerationError(error: unknown): boolean {
  if (error instanceof SyntaxError) return true;
  const value = error as { message?: string; cause?: { message?: string }; status?: number } | null;
  const message = `${value?.message ?? String(error)} ${value?.cause?.message ?? ''}`.toLowerCase();
  return [408, 429, 500, 502, 503, 504].includes(Number(value?.status))
    || /\b(408|429|500|502|503|504)\b|deadline[_ ]exceeded|deadline expired|timed?\s*out|quota|overloaded|fetch failed|econnreset|etimedout|enotfound|eai_again|terminated|aborted|aborterror|socket|network|empty text response/.test(message);
}
