import { parseManualStylistNotes } from './stylistManualNotesParser';

const shaliniSample = `=== Shalini — Consultation Notes ===
Phone: 642041682251
Date: June 5th, 2026

--- Profile ---
Age: 39
Occupation: Corporate
Height (cm): 147
Weight (kg): 76
Body Shape: Not Sure
Undertone: Warm
Skin Type: Combination
Hair Type: Wavy
Footwear Preference: Anything
White T-shirt/Kurta without makeup: Makes me dull
Natural skin tint: Yellowish

--- Style Goals & Motivations ---
What prompted this consultation: my husband fixed the appointment and i have no idea about fashion and styles
Main Style Goal: to dressup for my height
How they want to feel: Comfortable, Confident
Aesthetics: Classic, Minimalist

--- Body Concerns ---
Self-Conscious Areas: Tummy/Midsection

--- Restrictions & Boundaries ---
Fit Restrictions: Nothing tight (comfort priority)
Style Boundaries: Sleeveless

--- Wardrobe Preferences ---
Items/Styles She LOVES: very simple and basic,western,formals,trousers tops, only few sleeveless,midis or knee,wears belts, few ethnics,evening etc`;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runStylistManualNotesParserAssertions() {
  const parsed = parseManualStylistNotes(shaliniSample);

  invariant(parsed.fullName === 'Shalini', 'extracts client name');
  invariant(parsed.customerPhone === '642041682251', 'extracts phone');
  invariant(parsed.consultationDate === 'June 5th, 2026', 'extracts consultation date');
  invariant(parsed.ageRange === '39', 'extracts age');
  invariant(parsed.lifestyleContext.occupation === 'Corporate', 'extracts occupation');
  invariant(parsed.bodyMeasurements.height_cm === 147, 'extracts height');
  invariant(parsed.bodyMeasurements.weight_kg === 76, 'extracts weight');
  invariant(parsed.focusAreas.includes('Tummy/Midsection'), 'maps tummy/midsection focus');
  invariant(parsed.coverageRequirements.fit_priority === 'Nothing tight; comfort-first ease through the body.', 'maps loose fit');
  invariant(parsed.coverageRequirements.avoid_sleeveless === true, 'maps sleeveless boundary');
  invariant(parsed.rawConsultationNotes === shaliniSample, 'preserves raw notes');
}
