import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPlainObject,
  normalizeIsoDate,
  normalizeLowercaseString,
  normalizeString
} from '../../src/lib/api/validation.js';

test('isPlainObject aceita objetos literais e rejeita valores nao suportados', () => {
  assert.equal(isPlainObject({ chave: 'valor' }), true);
  assert.equal(isPlainObject(Object.create(null)), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isPlainObject('texto'), false);
  assert.equal(isPlainObject(null), false);
});

test('normalizeString e normalizeLowercaseString higienizam entradas', () => {
  assert.equal(normalizeString('  Escalas App  '), 'Escalas App');
  assert.equal(normalizeString(123), '');

  assert.equal(normalizeLowercaseString('  Group Owner  '), 'group owner');
  assert.equal(normalizeLowercaseString(undefined), '');
});

test('normalizeIsoDate valida formato e datas reais', () => {
  assert.equal(normalizeIsoDate('2026-04-21'), '2026-04-21');
  assert.equal(normalizeIsoDate('2026-02-29'), '');
  assert.equal(normalizeIsoDate('2024-02-29'), '2024-02-29');
  assert.equal(normalizeIsoDate('2026/04/21'), '');
  assert.equal(normalizeIsoDate(''), '');
});
