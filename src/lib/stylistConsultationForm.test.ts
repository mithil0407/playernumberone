import assert from 'node:assert/strict';
import test from 'node:test';
import { consultationFormSections, formAnswer } from './stylistConsultationForm.ts';
import { intakeChoices, parseNewClientIntake } from './stylistNewClientIntake.ts';

test('every answer saved by the migrated new-client form can be reviewed', () => {
  const clientData = {
    ...Object.fromEntries(Object.entries(intakeChoices).map(([key, choices]) => [key,
      ['occasionsNeedHelp', 'aesthetics', 'boundaries', 'fitRestrictions', 'fabricsPreferred', 'fabricsAvoided', 'bodyConcerns'].includes(key) ? [choices[0]] : choices[0]])),
    occupation: 'Other', occupationOther: 'Architect', city: 'Pune',
    age: 34, height: 163, weight: 61, consultationReason: 'New job',
    upcomingEvent: 'Conference', wardrobeChallenge: 'Finding comfortable workwear',
    fitRestrictionsOther: 'Room for movement', bodyConcernsOther: 'Sensitive waist',
    itemsLoved: 'Linen shirts', itemsHated: 'Stiff denim',
    goToOutfits: ['Kurta and trousers', 'Cotton dress', 'Jeans and shirt'], styleExperimentation: 7,
  };
  const saved = parseNewClientIntake({ clientName: 'Test Client', clientPhone: '9999999999', consultationDate: new Date().toISOString(), clientData });
  const fields = consultationFormSections(saved.clientData).flatMap(section => section.fields);
  for (const [key, value] of Object.entries(clientData)) {
    assert.equal(fields.find(field => field.key === key)?.value, formAnswer(value), `Missing or changed saved answer: ${key}`);
  }
  assert.ok(!fields.some(field => ['occasions', 'upcomingEvents', 'wardrobeLeastFavorites'].includes(field.key)), 'Compatibility aliases do not repeat current answers');
});

test('historical answers, legacy aliases and unfamiliar saved fields stay visible', () => {
  const data = { occasions: 'Work', upcomingEvents: 'Wedding', wardrobeLeastFavorites: 'Skinny jeans',
    styleGoal1: 'Feel confident', desiredFeelingsOther: 'Relaxed', lifeChangesOther: 'Career change',
    fabricRestrictionsOther: 'No wool', culturalRestrictionsOther: 'Covered shoulders',
    customStylistNote: 'Keep_this wording', outfitRatio: { formal: 0, casual: 70 },
  };
  const fields = consultationFormSections(data).flatMap(section => section.fields);
  for (const [key, value] of Object.entries(data)) assert.equal(fields.find(field => field.key === key)?.value, formAnswer(value));
  assert.equal(fields.find(field => field.key === 'customStylistNote')?.value, 'Keep_this wording');
  assert.match(fields.find(field => field.key === 'outfitRatio')!.value, /formal: 0/);
  const revised = consultationFormSections({ itemsHated: 'Denim', wardrobeLeastFavorites: 'Polyester' }).flatMap(section => section.fields);
  assert.equal(revised.length, 2, 'Different historical answers are not discarded as aliases');
});

test('blank forms do not invent answers', () => {
  assert.deepEqual(consultationFormSections({ city: '', aesthetics: [], bodyConcernsOther: null }), []);
  assert.equal(formAnswer('Earthy colours (Navy blue, rust, terracotta)'), 'Earthy colours (Navy blue, rust, terracotta)');
});
