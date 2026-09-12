export interface ConsultationReadiness {
  ready: boolean;
  missing: string[];
  photos: {
    headshot: boolean;
    full_body_front: boolean;
    full_body_side: boolean;
    one_outfit: boolean;
  };
  measurements: {
    shoulders: boolean;
    upper_body: boolean;
    waist: boolean;
    hips: boolean;
  };
}

function numeric(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function consultationReadiness(source: {
  upload: { photo_paths: Record<string, string>; measurements: Record<string, unknown> } | null;
}): ConsultationReadiness {
  const photos = source.upload?.photo_paths ?? {};
  const measurements = source.upload?.measurements ?? {};
  const photoState = {
    headshot: Boolean(photos.headshot),
    full_body_front: Boolean(photos.full_body_front),
    full_body_side: Boolean(photos.full_body_side),
    one_outfit: Boolean(photos.one_outfit),
  };
  const measurementState = {
    shoulders: numeric(measurements.shoulders) !== undefined,
    upper_body: numeric(measurements.bust) !== undefined || numeric(measurements.chest) !== undefined,
    waist: numeric(measurements.waist) !== undefined,
    hips: numeric(measurements.hips) !== undefined,
  };
  const missing = [
    !photoState.headshot ? 'Headshot' : '',
    !photoState.full_body_front ? 'Full-body front photo' : '',
    !photoState.full_body_side ? 'Full-body side photo' : '',
    !measurementState.shoulders ? 'Shoulder measurement' : '',
    !measurementState.upper_body ? 'Bust or chest measurement' : '',
    !measurementState.waist ? 'Waist measurement' : '',
    !measurementState.hips ? 'Hip measurement' : '',
  ].filter(Boolean);
  return { ready: missing.length === 0, missing, photos: photoState, measurements: measurementState };
}
