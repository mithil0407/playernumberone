// Both current and historical Flow answers live in consultations.client_data.
// Keep the saved form independent of the smaller report-generation snapshot.
const FORM_SECTIONS = [
  { title: 'Client profile', fields: [
    ['occupation', 'Occupation'], ['occupationOther', 'Occupation details'],
    ['city', 'City'], ['winterwearNeed', 'Winterwear need'], ['age', 'Age'],
    ['height', 'Height (cm)'], ['weight', 'Weight (kg)'],
  ] },
  { title: 'Consultation goals', fields: [
    ['consultationReason', 'Reason for consultation'], ['occasionsNeedHelp', 'Occasions to help with'],
    ['upcomingEvent', 'Upcoming event'], ['wardrobeChallenge', 'Wardrobe challenge'],
    ['styleGoal1', 'Style goal 1'], ['styleGoal2', 'Style goal 2'], ['styleGoal3', 'Style goal 3'],
    ['specialGoals', 'Special goals'], ['desiredFeelings', 'Desired feelings'],
    ['desiredFeelingsOther', 'Other desired feelings'],
  ] },
  { title: 'Style, wardrobe & fabrics', fields: [
    ['aesthetics', 'Aesthetics'], ['outfitRatioPreference', 'Western / ethnic outfits'],
    ['styleExperimentation', 'Style experimentation (1–10)'], ['goToOutfits', 'Go-to outfits'],
    ['itemsLoved', 'Items they love'], ['itemsHated', 'Items they avoid'],
    ['fabricsPreferred', 'Preferred fabrics'], ['fabricsAvoided', 'Fabrics to avoid'],
    ['footwear', 'Footwear preference'], ['outfitRatio', 'Outfit mix'], ['addons', 'Add-ons'],
  ] },
  { title: 'Body, coverage & boundaries', fields: [
    ['bodyShape', 'Body shape'], ['bodyConcerns', 'Body concerns'], ['bodyConcernsOther', 'Other body concerns'],
    ['bodyConcernsQuote', 'Body concerns in their words'], ['lifeChanges', 'Life changes'],
    ['lifeChangesOther', 'Other life changes'], ['boundaries', 'Clothing boundaries'],
    ['fitRestrictions', 'Fit restrictions'], ['fitRestrictionsOther', 'Other fit restrictions'],
    ['modestyPreference', 'Modesty preference'], ['modestyReason', 'Modesty reason'],
    ['fabricRestrictions', 'Fabric restrictions'], ['fabricRestrictionsOther', 'Other fabric restrictions'],
    ['culturalRestrictions', 'Cultural restrictions'], ['culturalRestrictionsOther', 'Other cultural restrictions'],
  ] },
  { title: 'Colour, skin & hair', fields: [
    ['skinTone', 'Undertone'], ['veinColor', 'Vein colour'], ['sunReaction', 'Reaction to sun'],
    ['skinTint', 'Natural skin tint'], ['metalPreference', 'Metal preference'],
    ['whiteClothingEffect', 'Pure white clothing'], ['colorFamilyPreference', 'Colour family'],
    ['skinType', 'Skin type'], ['hairType', 'Hair type'], ['hairChangeOpenness', 'Open to hair changes'],
  ] },
] as const;

const ALIASES = [
  ['occasionsNeedHelp', 'occasions', 'Occasions'],
  ['upcomingEvent', 'upcomingEvents', 'Upcoming events'],
  ['itemsHated', 'wardrobeLeastFavorites', 'Items they avoid'],
] as const;

export function formAnswer(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(formAnswer).filter(Boolean).join(', ');
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => {
      const answer = formAnswer(item);
      return answer ? `${key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}: ${answer}` : '';
    }).filter(Boolean).join('\n');
  return String(value);
}

export function consultationFormSections(data: Record<string, unknown>) {
  const sections: Array<{ title: string; fields: Array<{ key: string; label: string; value: string }> }> = FORM_SECTIONS.map(section => ({
    title: section.title,
    fields: section.fields.map(([key, label]) => ({ key, label: String(label), value: formAnswer(data[key]) })),
  }));
  const knownKeys = new Set<string>(FORM_SECTIONS.flatMap(section => section.fields.map(([key]) => key)));
  for (const [current, legacy, label] of ALIASES) {
    knownKeys.add(legacy);
    const legacyValue = formAnswer(data[legacy]);
    const currentValue = formAnswer(data[current]);
    // Older forms sometimes contain only the legacy answer. Keep a different
    // historical answer too, without repeating the current form's aliases.
    if (legacyValue && legacyValue !== currentValue) {
      const section = sections.find(item => item.fields.some(field => field.key === current))!;
      section.fields.push({ key: legacy, label: currentValue ? `${label} (earlier answer)` : label, value: legacyValue });
    }
  }
  const additional = Object.entries(data).filter(([key]) => !knownKeys.has(key))
    .map(([key, value]) => ({ key, label: key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '), value: formAnswer(value) }))
    .filter(field => field.value);
  return [
    ...sections.map(section => ({ ...section, fields: section.fields.filter(field => field.value) })),
    { title: 'Other saved answers', fields: additional },
  ].filter(section => section.fields.length);
}
