import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCategoryTagIdsInput } from '../../src/lib/categories/tags.js';
import { serializeUnavailabilityByDate } from '../../src/lib/components/unavailability.js';

test('normalizeCategoryTagIdsInput aceita IDs quando allowedCategoryTagIds esta vazio', () => {
  const result = normalizeCategoryTagIdsInput(['louvor', 'midia'], { allowedCategoryTagIds: [] });

  assert.deepEqual(result, ['louvor', 'midia']);
});

test('serializeUnavailabilityByDate preserva registros sem filtro explicito de categorias', () => {
  const document = {
    unavailabilityByDate: [
      { date: '2026-05-10', categoryTagIds: ['louvor'] },
      { date: '2026-05-11', categoryTagIds: ['midia'] }
    ]
  };

  const result = serializeUnavailabilityByDate(document, { futureOnly: false, allowedCategoryTagIds: [] });

  assert.deepEqual(result, [
    { date: '2026-05-10', categoryTagIds: ['louvor'] },
    { date: '2026-05-11', categoryTagIds: ['midia'] }
  ]);
});
