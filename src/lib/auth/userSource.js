import { authUsers as seededAuthUsers } from '../../data/authUsers.js';
import { AUTH_ROLES } from './constants.js';
import { getMongoCollections } from '../db/mongodb.js';

const PERMISSION_TYPE_TO_ROLE = Object.freeze({
  'admin-panel': AUTH_ROLES.ADMIN,
  'group-app': AUTH_ROLES.GROUP_OWNER,
  'component-app': AUTH_ROLES.COMPONENT
});

function mapPermissionTypeToRole(permissionType) {
  if (typeof permissionType !== 'string') {
    return AUTH_ROLES.COMPONENT;
  }

  return PERMISSION_TYPE_TO_ROLE[permissionType.trim()] || AUTH_ROLES.COMPONENT;
}

function mapComponentToAuthUser(component) {
  if (!component || typeof component !== 'object') {
    return null;
  }

  const id = typeof component._id === 'string' ? component._id.trim() : '';
  const username = typeof component.username === 'string' ? component.username.trim() : '';
  const passwordHash = typeof component.passwordHash === 'string' ? component.passwordHash.trim() : '';
  const groupId = typeof component.groupId === 'string' ? component.groupId.trim() : '';

  if (!id || !username || !passwordHash || !groupId) {
    return null;
  }

  const name =
    (typeof component.fullName === 'string' && component.fullName.trim()) ||
    username;

  return {
    id,
    name,
    email: '',
    username,
    identifier: username,
    role: mapPermissionTypeToRole(component.permissionType),
    groupId,
    passwordHash
  };
}

export async function loadAuthUsers() {
  const baseUsers = Array.isArray(seededAuthUsers) ? [...seededAuthUsers] : [];

  try {
    const { components } = await getMongoCollections();
    const dbComponents = await components
      .find({
        passwordHash: { $type: 'string', $ne: '' },
        isActive: { $ne: false }
      })
      .project({
        _id: 1,
        fullName: 1,
        username: 1,
        permissionType: 1,
        groupId: 1,
        passwordHash: 1
      })
      .toArray();

    const byId = new Map(baseUsers.map((user) => [user.id, user]));

    dbComponents.forEach((component) => {
      const authUser = mapComponentToAuthUser(component);

      if (authUser && !byId.has(authUser.id)) {
        byId.set(authUser.id, authUser);
      }
    });

    return Array.from(byId.values());
  } catch {
    return baseUsers;
  }
}
