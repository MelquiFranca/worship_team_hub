import { AUTH_ROLES } from '../lib/auth/constants.js';
import { createPasswordHash } from '../lib/auth/password.js';

export const authUsers = [
  {
    id: 'user-admin-001',
    name: 'Admin Escalas',
    email: 'admin@escalas.app',
    username: 'admin@escalas.app',
    role: AUTH_ROLES.ADMIN,
    groupId: null,
    passwordHash: createPasswordHash('123456', {
      salt: 'admin-seed-salt-v1'
    })
  },
  {
    id: 'user-group-owner-001',
    name: 'Avivah Ministerios',
    email: 'avivah@ministerio.com',
    username: 'avivah@ministerio.com',
    role: AUTH_ROLES.GROUP_OWNER,
    groupId: '607c71ca0171590015ff9c91',
    passwordHash: createPasswordHash('123456', {
      salt: 'group-owner-seed-salt-v1'
    })
  },
  {
    id: 'user-component-001',
    name: 'Lucas Andrade',
    email: 'lucas.andrade@escalas.app',
    username: 'lucas.andrade',
    role: AUTH_ROLES.COMPONENT,
    groupId: '607c71ca0171590015ff9c91',
    passwordHash: createPasswordHash('123456', {
      salt: 'component-seed-salt-v1'
    })
  }
];

