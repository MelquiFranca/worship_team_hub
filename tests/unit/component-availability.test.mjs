import assert from 'node:assert/strict';
import test from 'node:test';
import { getUnavailableComponentsForDateByCategory } from '../../src/lib/scales/componentAvailability.js';

test('bloqueia apenas quando categoria da escala esta em unavailabilityByDate', () => {
  const components = [
    {
      _id: 'component-1',
      fullName: 'Componente 1',
      unavailableDates: ['2026-05-05'],
      unavailabilityByDate: [
        {
          date: '2026-05-05',
          categoryTagIds: ['midia']
        }
      ]
    }
  ];

  const louvorResult = getUnavailableComponentsForDateByCategory(components, '2026-05-05', 'louvor');
  const midiaResult = getUnavailableComponentsForDateByCategory(components, '2026-05-05', 'midia');

  assert.equal(louvorResult.length, 0);
  assert.equal(midiaResult.length, 1);
  assert.equal(midiaResult[0].id, 'component-1');
});

test('nao usa unavailableDates legado para bloquear indisponibilidade por categoria', () => {
  const components = [
    {
      _id: 'component-2',
      fullName: 'Componente 2',
      unavailableDates: ['2026-05-06'],
      unavailabilityByDate: []
    }
  ];

  const result = getUnavailableComponentsForDateByCategory(components, '2026-05-06', 'louvor');

  assert.equal(result.length, 0);
});
