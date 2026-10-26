// Keep these field names aligned with the consultation data written by Flow.
// Existing report generation reads this shape from consultations.client_data.
export const intakeChoices = {
  occupation: ['Corporate', 'Creative', 'WFH', 'Homemaker', 'Student', 'Other'],
  winterwearNeed: ['No - hot/humid year-round', 'Yes - cold months', 'Only for travel'],
  occasionsNeedHelp: ['Daily wear', 'Work/Office', 'Wedding & functions', 'Party/Event', 'Date/Dinner', 'Travel', 'Festive'],
  aesthetics: ['Classic', 'Bohemian', 'Minimalist', 'Edgy', 'Glamorous', 'Sporty', 'Eclectic', 'Trendy'],
  boundaries: ['Sleeveless', 'Deep Neck', 'Backless', 'Short Skirt', 'No Restrictions'],
  fitRestrictions: ['Nothing tight (comfort priority)', 'Nothing too loose (wants definition)', 'High-waisted only', 'Avoid belts/waist emphasis', 'None'],
  fabricsPreferred: ['Cotton', 'Linen', 'Silk', 'Rayon/Viscose', 'Knits/Jersey', 'Denim', 'Chiffon/Georgette', 'No preference'],
  fabricsAvoided: ['Polyester', 'Satin', 'Net/Sheer', 'Wool/itchy fabrics', 'Stiff fabrics', 'Dry-clean only', 'None'],
  footwear: ['1.2-2 inch heel', 'Anything', 'Flats only'],
  bodyShape: ['Hourglass', 'Pear', 'Apple', 'Rectangle', 'Inverted Triangle', 'Not Sure'],
  bodyConcerns: ['Arms (heavy/flabby)', 'Tummy/Midsection', 'Hips/Thighs', 'Bust (too large/small)', 'Height (too short/tall)', 'Shoulders (broad/narrow)', 'Back fat', 'Love handles', 'Post-pregnancy body', 'Weight gain/loss', 'None mentioned'],
  outfitRatioPreference: ['More Western', 'More Ethnic', 'Equal'],
  skinTone: ['Warm', 'Cool', 'Neutral', 'Unsure'],
  veinColor: ['Blue', 'Green/Olive', 'Purple', 'Mixed'],
  sunReaction: ['Immediate tanning', 'Turn pink or reddish', 'No effect/gradual tanning'],
  skinTint: ['Orangish', 'Pinkish', 'Yellowish'],
  metalPreference: ['Gold', 'Silver', 'Oxidised', 'Pearl/Gemstones'],
  whiteClothingEffect: ['Makes me glow', 'Makes me dull', 'No effect'],
  colorFamilyPreference: ['Pastel colours (Baby blue, butter yellow, sage)', 'Earthy colours (Navy blue, rust, terracotta)'],
  skinType: ['Oily', 'Dry', 'Combination'],
  hairType: ['Straight', 'Wavy', 'Curly', 'Coily', 'Fine', 'Thick'],
  hairChangeOpenness: ['Yes', 'No', 'Only haircut, no hair colour'],
} as const;

const textLimits = {
  occupationOther: 100, city: 100, upcomingEvent: 500,
  consultationReason: 2000, wardrobeChallenge: 2000,
  fitRestrictionsOther: 200, itemsLoved: 2000, itemsHated: 2000,
  bodyConcernsOther: 200,
} as const;

const requiredChoices = ['occupation', 'footwear', 'bodyShape', 'skinTone', 'skinType', 'hairType'] as const;
const optionalChoices = ['winterwearNeed', 'outfitRatioPreference', 'veinColor', 'sunReaction', 'skinTint', 'metalPreference', 'whiteClothingEffect', 'colorFamilyPreference', 'hairChangeOpenness'] as const;
const multipleChoices = ['occasionsNeedHelp', 'aesthetics', 'boundaries', 'fitRestrictions', 'fabricsPreferred', 'fabricsAvoided', 'bodyConcerns'] as const;

export type NewClientIntake = {
  clientName: string;
  clientPhone: string;
  consultationDate: string;
  clientData: Record<string, string | number | string[] | undefined>;
};

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function boundedText(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('One or more form answers are invalid.');
  return value.trim();
}

function boundedNumber(value: unknown, min: number, max: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error('Check the age, height, weight and experimentation values.');
  return number;
}

export function parseNewClientIntake(value: unknown): NewClientIntake {
  const input = object(value);
  const rawData = object(input?.clientData);
  if (!input || !rawData) throw new Error('Complete the client form before saving.');
  const clientName = boundedText(input.clientName, 100);
  const clientPhone = boundedText(input.clientPhone, 20);
  if (!clientName || !/^[+\d\s().-]{7,20}$/.test(clientPhone)) throw new Error('Enter a client name and valid phone number.');
  if (typeof input.consultationDate !== 'string' || !input.consultationDate || Number.isNaN(Date.parse(input.consultationDate))) throw new Error('Enter a valid consultation date.');
  const consultationDate = new Date(input.consultationDate);
  if (consultationDate.getTime() > Date.now() + 86_400_000 || consultationDate.getTime() < Date.now() - 5 * 365 * 86_400_000) throw new Error('Check the consultation date.');

  const clientData: NewClientIntake['clientData'] = {};
  for (const [key, max] of Object.entries(textLimits)) clientData[key] = boundedText(rawData[key] ?? '', max);
  for (const key of requiredChoices) {
    const answer = rawData[key];
    if (typeof answer !== 'string' || !(intakeChoices[key] as readonly string[]).includes(answer)) throw new Error(`Choose a valid ${key} answer.`);
    clientData[key] = answer;
  }
  for (const key of optionalChoices) {
    const answer = rawData[key];
    if (answer === undefined || answer === '') continue;
    if (typeof answer !== 'string' || !(intakeChoices[key] as readonly string[]).includes(answer)) throw new Error(`Choose a valid ${key} answer.`);
    clientData[key] = answer;
  }
  for (const key of multipleChoices) {
    const answers = rawData[key] ?? [];
    if (!Array.isArray(answers) || answers.length > 12 || answers.some(answer => typeof answer !== 'string' || !(intakeChoices[key] as readonly string[]).includes(answer))) throw new Error(`Choose valid ${key} answers.`);
    const unique = [...new Set(answers as string[])];
    if (key === 'occasionsNeedHelp' && unique.length > 3) throw new Error('Choose up to three occasions.');
    if ((key === 'aesthetics' || key === 'boundaries') && unique.length === 0) throw new Error('Choose at least one aesthetic and boundary.');
    clientData[key] = unique;
  }
  if (clientData.occupation === 'Other' && !clientData.occupationOther) throw new Error('Enter the client’s occupation.');
  clientData.age = boundedNumber(rawData.age, 1, 120);
  clientData.height = boundedNumber(rawData.height, 100, 250);
  clientData.weight = boundedNumber(rawData.weight, 20, 300);
  if (rawData.styleExperimentation !== undefined && rawData.styleExperimentation !== '') clientData.styleExperimentation = boundedNumber(rawData.styleExperimentation, 1, 10);
  const outfits = rawData.goToOutfits ?? ['', '', ''];
  if (!Array.isArray(outfits) || outfits.length !== 3) throw new Error('Enter up to three go-to outfits.');
  clientData.goToOutfits = outfits.map(item => boundedText(item, 200)).filter(Boolean);
  // Preserve the legacy fields consumed by Flow and report generation.
  clientData.wardrobeLeastFavorites = clientData.itemsHated;
  clientData.occasions = (clientData.occasionsNeedHelp as string[]).join(', ');
  clientData.upcomingEvents = clientData.upcomingEvent;
  clientData.specialGoals = '';
  return { clientName, clientPhone, consultationDate: consultationDate.toISOString(), clientData };
}
