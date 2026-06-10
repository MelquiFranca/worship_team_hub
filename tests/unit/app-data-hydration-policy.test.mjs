import assert from 'node:assert/strict';
import test from 'node:test';
import { canHydrateGroupedComponentUnavailability } from '../../src/context/appDataHydrationPolicy.js';

test('permite indisponibilidade agrupada para audiences administrativas do grupo', () => {
  assert.equal(canHydrateGroupedComponentUnavailability('admin-panel'), true);
  assert.equal(canHydrateGroupedComponentUnavailability('group-app'), true);
});

test('bloqueia indisponibilidade agrupada para component-app e audiences invalidas', () => {
  assert.equal(canHydrateGroupedComponentUnavailability('component-app'), false);
  assert.equal(canHydrateGroupedComponentUnavailability(''), false);
  assert.equal(canHydrateGroupedComponentUnavailability(null), false);
});
