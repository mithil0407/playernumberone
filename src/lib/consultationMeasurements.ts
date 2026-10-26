// Shared by the client upload page, its API and report intake. Pure: no
// server or browser APIs.

export const CLIENT_UPLOAD_PHOTOS = [
  { key: 'full_body_front', label: 'Full-body photo, front', hint: 'Stand straight, arms relaxed, head to toe in the frame.', required: true },
  { key: 'full_body_side', label: 'Full-body photo, side', hint: 'Turn sideways, same distance, head to toe in the frame.', required: true },
  { key: 'headshot', label: 'Face photo', hint: 'Daylight, no filter, no makeup if you can.', required: true },
  { key: 'one_outfit', label: 'An outfit you love', hint: 'Optional. Something you feel great in.', required: false },
] as const;

export const CLIENT_UPLOAD_MEASUREMENTS = [
  { key: 'shoulders', label: 'Shoulders', hint: 'Across the back, from one shoulder tip to the other' },
  { key: 'bust', label: 'Bust', hint: 'Around the fullest part of the bust' },
  { key: 'chest', label: 'Chest', hint: 'Around the ribcage, just under the bust' },
  { key: 'waist', label: 'Waist', hint: 'Around the narrowest part of the waist' },
  { key: 'hips', label: 'Hips', hint: 'Around the fullest part of the hips' },
] as const;

export type ClientUploadPhotoKey = typeof CLIENT_UPLOAD_PHOTOS[number]['key'];
export type ClientUploadMeasurementKey = typeof CLIENT_UPLOAD_MEASUREMENTS[number]['key'];
export type MeasurementUnit = 'in' | 'cm';

const RANGES: Record<MeasurementUnit, [number, number]> = { in: [8, 80], cm: [20, 200] };

/** Validates what a client typed. Values stay as typed; the unit travels with them. */
export function parseClientMeasurements(raw: unknown): Record<ClientUploadMeasurementKey, string> & { unit: MeasurementUnit } {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const unit: MeasurementUnit = input.unit === 'cm' ? 'cm' : 'in';
  const [min, max] = RANGES[unit];
  const result = { unit } as Record<ClientUploadMeasurementKey, string> & { unit: MeasurementUnit };
  for (const { key, label } of CLIENT_UPLOAD_MEASUREMENTS) {
    const text = typeof input[key] === 'number' ? String(input[key]) : typeof input[key] === 'string' ? (input[key] as string).trim() : '';
    if (!/^[0-9]+(\.[0-9]+)?$/.test(text)) throw new Error(`Enter your ${label.toLowerCase()} measurement.`);
    const value = Number(text);
    if (value < min || value > max) throw new Error(`Check your ${label.toLowerCase()} measurement. It should be in ${unit === 'in' ? 'inches' : 'centimetres'}.`);
    result[key] = String(Math.round(value * 10) / 10);
  }
  return result;
}

/**
 * Older client uploads saved inches with no unit. A stored unit always wins;
 * otherwise only body-sized centimetre values (waist over 60, hips or bust
 * over 70) are read as centimetres.
 */
export function inferMeasurementUnit(measurements: Record<string, unknown>): MeasurementUnit {
  const unit = String(measurements.unit ?? '').trim().toLowerCase();
  if (['in', 'inch', 'inches'].includes(unit)) return 'in';
  if (['cm', 'cms', 'centimetre', 'centimetres', 'centimeter', 'centimeters'].includes(unit)) return 'cm';
  const number = (key: string) => {
    const parsed = Number.parseFloat(String(measurements[key] ?? '').replace(/[^0-9.]+/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const waist = number('waist');
  const hips = number('hips');
  const bust = number('bust') ?? number('chest');
  if ((waist ?? 0) > 60 || (hips ?? 0) > 70 || (bust ?? 0) > 70) return 'cm';
  return waist !== undefined || hips !== undefined || bust !== undefined ? 'in' : 'cm';
}
