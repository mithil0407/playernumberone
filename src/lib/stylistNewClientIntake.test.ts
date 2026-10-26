import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseNewClientIntake } from './stylistNewClientIntake.ts';

function valid() {
  return {
    clientName: 'Test Client', clientPhone: '+91 9876543210',
    consultationDate: new Date().toISOString(),
    clientData: {
      occupation: 'Creative', age: 30, height: 165, weight: 55,
      footwear: 'Anything', bodyShape: 'Not Sure', skinTone: 'Unsure',
      skinType: 'Combination', hairType: 'Straight',
      occasionsNeedHelp: ['Work/Office'], aesthetics: ['Classic'], boundaries: ['No Restrictions'],
      fitRestrictions: [], fabricsPreferred: [], fabricsAvoided: [], bodyConcerns: [],
      goToOutfits: ['Kurta', '', 'Jeans'], consultationReason: 'Wardrobe refresh',
      itemsHated: 'Scratchy fabric',
    },
  };
}

test('normalizes legacy Flow intake fields for report generation', () => {
  const intake = parseNewClientIntake(valid());
  assert.deepEqual(intake.clientData.goToOutfits, ['Kurta', 'Jeans']);
  assert.equal(intake.clientData.wardrobeLeastFavorites, 'Scratchy fabric');
  assert.equal(intake.clientData.occasions, 'Work/Office');
  assert.equal(intake.clientData.consultationReason, 'Wardrobe refresh');
});

test('rejects invalid required answers and ignores unrecognized fields', () => {
  const input = valid();
  assert.throws(() => parseNewClientIntake({ ...input, clientData: { ...input.clientData, occupation: 'Administrator' } }));
  assert.throws(() => parseNewClientIntake({ ...input, clientData: { ...input.clientData, occasionsNeedHelp: ['Work/Office', 'Daily wear', 'Travel', 'Festive'] } }));
  const parsed = parseNewClientIntake({ ...input, clientData: { ...input.clientData, secret: 'never stored' } });
  assert.equal(parsed.clientData.secret, undefined);
});
