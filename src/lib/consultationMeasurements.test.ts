import assert from 'node:assert/strict';
import test from 'node:test';
import { inferMeasurementUnit, parseClientMeasurements } from './consultationMeasurements.ts';
import { isClientUploadPath } from './stylistWorkspaceSecurity.ts';
import { isMetaPageViewExcluded } from './metaPageView.ts';

const inches = { shoulders: '15', bust: '36', chest: '31', waist: '30', hips: '40' };

test('client measurements keep their unit and reject impossible values', () => {
  assert.deepEqual(parseClientMeasurements({ unit: 'in', ...inches }), { unit: 'in', ...inches });
  assert.equal(parseClientMeasurements({ unit: 'cm', shoulders: 38, bust: 91, chest: 79, waist: 76.25, hips: 101 }).waist, '76.3');
  assert.equal(parseClientMeasurements({ unit: 'weird', ...inches }).unit, 'in');
  assert.throws(() => parseClientMeasurements({ unit: 'in', ...inches, waist: '' }), /waist/);
  assert.throws(() => parseClientMeasurements({ unit: 'in', ...inches, hips: '101' }), /hips/);
  assert.throws(() => parseClientMeasurements({ unit: 'cm', shoulders: 38, bust: 91, chest: 79, waist: '-3', hips: 101 }), /waist/);
});

test('old unitless client uploads are read as inches unless clearly centimetres', () => {
  assert.equal(inferMeasurementUnit(inches), 'in');
  assert.equal(inferMeasurementUnit({ waist: '76', hips: '98', bust: '90' }), 'cm');
  assert.equal(inferMeasurementUnit({ ...inches, unit: 'cm' }), 'cm');
  assert.equal(inferMeasurementUnit({ waist: '80', unit: 'in' }), 'in');
  assert.equal(inferMeasurementUnit({}), 'cm');
});

test('upload page and API are private paths and never tracked', () => {
  const token = 'a'.repeat(48);
  assert.ok(isClientUploadPath(`/upload/${token}`));
  assert.ok(isClientUploadPath(`/api/consultation-upload/${token}`));
  assert.ok(!isClientUploadPath('/uploads'));
  assert.ok(isMetaPageViewExcluded(`/upload/${token}`));
});
