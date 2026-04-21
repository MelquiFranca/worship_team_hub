import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getLoginPathForPolicy,
  getRoutePolicy,
  isAdminProtectedPath,
  isPublicAuthPath
} from '../../src/lib/auth/policies.js';

test('rotas publicas de login permanecem acessiveis sem sessao', () => {
  assert.equal(isPublicAuthPath('/login'), true);
  assert.equal(isPublicAuthPath('/admin/login/'), true);
  assert.equal(isPublicAuthPath('/escalas'), false);
});

test('politicas de rota essenciais do MVP estao corretas', () => {
  const adminPolicy = getRoutePolicy('/admin/grupos');
  const ownerPolicy = getRoutePolicy('/cadastro-escalas');
  const memberPolicy = getRoutePolicy('/escalas');

  assert.equal(adminPolicy?.name, 'admin');
  assert.equal(adminPolicy?.loginPath, '/admin/login');

  assert.equal(ownerPolicy?.name, 'group-management');
  assert.equal(ownerPolicy?.allowedPairs?.[0]?.role, 'group_owner');

  assert.equal(memberPolicy?.name, 'member');
  assert.equal(memberPolicy?.allowedPairs?.length, 2);
});

test('rota admin exige politica de area protegida e caminho de login coerente', () => {
  assert.equal(isAdminProtectedPath('/admin'), true);
  assert.equal(isAdminProtectedPath('/admin/configuracoes/'), true);
  assert.equal(isAdminProtectedPath('/escalas'), false);

  const defaultLoginPath = getLoginPathForPolicy(null);
  assert.equal(defaultLoginPath, '/login');
});
