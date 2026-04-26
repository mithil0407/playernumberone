import type { RevenueCurrency } from '@/lib/revenueEvents';

export interface FxConversion {
  amountInrMinor: number | null;
  fxRateToInr: number | null;
  fxSource: string;
  fxRecordedAt: string;
  warning?: string;
}

function readRate(currency: RevenueCurrency) {
  if (currency === 'INR') return { rate: 1, source: 'native' };
  const key = currency === 'AUD' ? 'REVENUE_FX_AUD_TO_INR' : 'REVENUE_FX_USD_TO_INR';
  const rate = Number(process.env[key]);
  if (!Number.isFinite(rate) || rate <= 0) {
    return { rate: null, source: `missing:${key}` };
  }
  return { rate, source: `env:${key}` };
}

export function convertMinorToInr(amountMinor: number, currency: RevenueCurrency, recordedAt = new Date().toISOString()): FxConversion {
  const { rate, source } = readRate(currency);
  if (rate === null) {
    return {
      amountInrMinor: currency === 'INR' ? amountMinor : null,
      fxRateToInr: currency === 'INR' ? 1 : null,
      fxSource: source,
      fxRecordedAt: recordedAt,
      warning: `Missing INR conversion rate for ${currency}.`,
    };
  }

  return {
    amountInrMinor: Math.round(amountMinor * rate),
    fxRateToInr: rate,
    fxSource: source,
    fxRecordedAt: recordedAt,
  };
}

export function getFxWarnings(currencies: RevenueCurrency[]) {
  return currencies
    .filter(currency => currency !== 'INR')
    .map(currency => convertMinorToInr(1, currency).warning)
    .filter((warning): warning is string => Boolean(warning));
}

