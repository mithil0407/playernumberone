export interface ParsedManualStylistNotes {
  fullName: string;
  customerPhone: string;
  consultationDate: string;
  ageRange: string;
  bodyMeasurements: Record<string, unknown>;
  focusAreas: string[];
  coverageRequirements: Record<string, unknown>;
  lifestyleContext: Record<string, unknown>;
  piecePreferences: Record<string, unknown>;
  selectedMoodboardLabel: string | null;
  secondaryMoodboardElements: string[];
  hairContext: Record<string, unknown>;
  skinToneSelfDescription: string | null;
  shoppingRelationship: string | null;
  priorStylingExperience: Record<string, unknown>;
  rawConsultationNotes: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function firstLabelValue(notes: string, label: string) {
  const match = notes.match(new RegExp(`^\\s*${escapeRegExp(label)}\\s*:\\s*(.+?)\\s*$`, 'im'));
  return match?.[1]?.trim() ?? '';
}

function splitList(value: string) {
  return value
    .split(/,|;|\band\b/i)
    .map(item => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseName(notes: string) {
  const titleMatch = notes.match(/^\s*={2,}\s*([^=\n-]+?)(?:\s+[—-]\s+.+?)?\s*={2,}\s*$/m);
  if (titleMatch?.[1]?.trim()) return titleMatch[1].trim();
  return firstLabelValue(notes, 'Name') || firstLabelValue(notes, 'Client');
}

function unique(items: string[]) {
  return Array.from(new Set(items.map(item => item.trim()).filter(Boolean)));
}

function garmentSignals(preferences: string) {
  const lower = preferences.toLowerCase();
  const signals: string[] = [];
  const addIf = (pattern: RegExp, label: string) => {
    if (pattern.test(lower)) signals.push(label);
  };
  addIf(/\bwestern\b/, 'Western separates');
  addIf(/\bformal|corporate|office\b/, 'Corporate formals');
  addIf(/\btrouser|pant\b/, 'Trousers');
  addIf(/\btop|blouse|shirt\b/, 'Tops and blouses');
  addIf(/\bmidi|knee\b/, 'Midi or knee-length dresses');
  addIf(/\bbelt\b/, 'Belts');
  addIf(/\bethnic|kurta|saree|sari\b/, 'Selective ethnic wear');
  addIf(/\bevening\b/, 'Evening outfits');
  addIf(/\bsimple|basic|minimal\b/, 'Simple basics');
  return signals;
}

export function parseManualStylistNotes(notes: string): ParsedManualStylistNotes {
  const rawConsultationNotes = notes.trim();
  const fullName = parseName(rawConsultationNotes);
  const customerPhone = firstLabelValue(rawConsultationNotes, 'Phone');
  const consultationDate = firstLabelValue(rawConsultationNotes, 'Date');
  const age = firstLabelValue(rawConsultationNotes, 'Age');
  const occupation = firstLabelValue(rawConsultationNotes, 'Occupation');
  const heightCm = parseNumber(firstLabelValue(rawConsultationNotes, 'Height (cm)'));
  const weightKg = parseNumber(firstLabelValue(rawConsultationNotes, 'Weight (kg)'));
  const bodyShape = firstLabelValue(rawConsultationNotes, 'Body Shape');
  const undertone = firstLabelValue(rawConsultationNotes, 'Undertone');
  const skinType = firstLabelValue(rawConsultationNotes, 'Skin Type');
  const hairType = firstLabelValue(rawConsultationNotes, 'Hair Type');
  const footwearPreference = firstLabelValue(rawConsultationNotes, 'Footwear Preference');
  const whiteTshirtReaction = firstLabelValue(rawConsultationNotes, 'White T-shirt/Kurta without makeup');
  const naturalSkinTint = firstLabelValue(rawConsultationNotes, 'Natural skin tint');
  const promptedBy = firstLabelValue(rawConsultationNotes, 'What prompted this consultation');
  const mainStyleGoal = firstLabelValue(rawConsultationNotes, 'Main Style Goal');
  const desiredFeelings = splitList(firstLabelValue(rawConsultationNotes, 'How they want to feel'));
  const aesthetics = splitList(firstLabelValue(rawConsultationNotes, 'Aesthetics'));
  const selfConsciousAreas = splitList(firstLabelValue(rawConsultationNotes, 'Self-Conscious Areas'));
  const fitRestrictions = firstLabelValue(rawConsultationNotes, 'Fit Restrictions');
  const styleBoundaries = firstLabelValue(rawConsultationNotes, 'Style Boundaries');
  const loves = firstLabelValue(rawConsultationNotes, 'Items/Styles She LOVES');

  const focusAreas = [...selfConsciousAreas];
  if (/tummy|midsection|stomach|waist/i.test(`${selfConsciousAreas.join(' ')} ${mainStyleGoal}`)) {
    focusAreas.push('Tummy/Midsection');
  }
  if (/height|petite|short/i.test(mainStyleGoal) || (heightCm !== null && heightCm < 155)) {
    focusAreas.push('Petite vertical elongation');
  }

  const avoidSleeveless = /\bsleeveless\b/i.test(styleBoundaries);
  const looseFit = /nothing tight|not tight|loose|comfort/i.test(fitRestrictions);
  const selectedMoodboardLabel = aesthetics.length ? aesthetics.join(' / ') : null;
  const skinToneParts = [
    undertone ? `Undertone: ${undertone}` : '',
    naturalSkinTint ? `Natural skin tint: ${naturalSkinTint}` : '',
    whiteTshirtReaction ? `White T-shirt/Kurta without makeup: ${whiteTshirtReaction}` : '',
    skinType ? `Skin type: ${skinType}` : '',
  ].filter(Boolean);

  return {
    fullName,
    customerPhone,
    consultationDate,
    ageRange: age ? `${age}` : '',
    bodyMeasurements: {
      ...(heightCm !== null ? { height_cm: heightCm } : {}),
      ...(weightKg !== null ? { weight_kg: weightKg } : {}),
      ...(bodyShape ? { body_shape: bodyShape } : {}),
      ...(age ? { age_years: parseNumber(age) ?? age } : {}),
    },
    focusAreas: unique(focusAreas),
    coverageRequirements: {
      ...(fitRestrictions ? { fit_restrictions: fitRestrictions } : {}),
      ...(styleBoundaries ? { style_boundaries: styleBoundaries } : {}),
      ...(looseFit ? { fit_priority: 'Nothing tight; comfort-first ease through the body.' } : {}),
      ...(avoidSleeveless ? { arm_coverage: 'Avoid sleeveless; use sleeves or an intentional layer.' } : {}),
      ...(avoidSleeveless ? { avoid_sleeveless: true } : {}),
    },
    lifestyleContext: {
      ...(consultationDate ? { consultation_date: consultationDate } : {}),
      ...(occupation ? { occupation } : {}),
      ...(promptedBy ? { consultation_prompt: promptedBy } : {}),
      ...(mainStyleGoal ? { main_style_goal: mainStyleGoal } : {}),
      ...(desiredFeelings.length ? { desired_feelings: desiredFeelings } : {}),
      ...(aesthetics.length ? { aesthetics } : {}),
      market: 'India',
    },
    piecePreferences: {
      ...(loves ? { loves } : {}),
      ...(footwearPreference ? { footwear_preference: footwearPreference } : {}),
      preferred_garments: garmentSignals(loves),
    },
    selectedMoodboardLabel,
    secondaryMoodboardElements: aesthetics,
    hairContext: {
      ...(hairType ? { hair_type: hairType } : {}),
    },
    skinToneSelfDescription: skinToneParts.length ? skinToneParts.join('\n') : null,
    shoppingRelationship: loves || null,
    priorStylingExperience: {
      ...(promptedBy ? { consultation_context: promptedBy } : {}),
      source: 'manual_admin_notes',
    },
    rawConsultationNotes,
  };
}
