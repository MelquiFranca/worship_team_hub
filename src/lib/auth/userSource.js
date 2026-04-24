import { ObjectId } from 'mongodb';
import { AUTH_ROLES } from './constants.js';
import { AUTH_ERROR_CODES, createAuthError } from './errors.js';
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
  const permissionType = typeof component.permissionType === 'string' ? component.permissionType.trim() : '';
  const groupId = typeof component.groupId === 'string' ? component.groupId.trim() : '';
  const role = mapPermissionTypeToRole(permissionType);
  const normalizedGroupId = role === AUTH_ROLES.ADMIN ? null : groupId;

  if (!id || !username || !passwordHash || (role !== AUTH_ROLES.ADMIN && !groupId)) {
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
    role,
    groupId: normalizedGroupId,
    passwordHash
  };
}

function normalizeGroupStatus(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'inactive' ? 'inactive' : 'active';
}

function normalizeGroupName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveGroupIds(users) {
  return Array.from(
    new Set(
      users
        .map((user) => (typeof user?.groupId === 'string' ? user.groupId.trim() : ''))
        .filter(Boolean)
    )
  );
}

function buildGroupIdFilter(groupIds) {
  if (!Array.isArray(groupIds) || groupIds.length === 0) {
    return null;
  }

  const asStringIds = groupIds;
  const asObjectIds = groupIds
    .filter((groupId) => ObjectId.isValid(groupId))
    .map((groupId) => new ObjectId(groupId));

  const filters = [];

  if (asStringIds.length > 0) {
    filters.push({ _id: { $in: asStringIds } });
  }

  if (asObjectIds.length > 0) {
    filters.push({ _id: { $in: asObjectIds } });
  }

  if (filters.length === 1) {
    return filters[0];
  }

  return { $or: filters };
}

function mapGroupsById(groups) {
  const byId = new Map();

  groups.forEach((group) => {
    const groupId = group?._id != null ? String(group._id) : '';

    if (!groupId) {
      return;
    }

    byId.set(groupId, {
      status: normalizeGroupStatus(group?.status),
      name: normalizeGroupName(group?.name)
    });
  });

  return byId;
}

function attachGroupInfo(user, groupsById) {
  if (!user || typeof user !== 'object') {
    return user;
  }

  const groupId = typeof user.groupId === 'string' ? user.groupId.trim() : '';

  if (!groupId) {
    return user;
  }

  const group = groupsById.get(groupId);

  return {
    ...user,
    groupStatus: group?.status || 'active',
    groupName: group?.name || ''
  };
}

export async function loadAuthUsers() {
  try {
    const { db, components } = await getMongoCollections();
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
    const groupsCollection = db.collection('groups');
    const allGroupIds = resolveGroupIds(dbComponents);
    const groupFilter = buildGroupIdFilter(allGroupIds);
    const dbGroups = groupFilter
      ? await groupsCollection
        .find(groupFilter)
        .project({
          _id: 1,
          name: 1,
          status: 1
        })
        .toArray()
      : [];
    const groupsById = mapGroupsById(dbGroups);

    const byId = new Map();

    dbComponents.forEach((component) => {
      const authUser = attachGroupInfo(mapComponentToAuthUser(component), groupsById);

      if (authUser && !byId.has(authUser.id)) {
        byId.set(authUser.id, authUser);
      }
    });

    return Array.from(byId.values());
  } catch (error) {
    throw createAuthError(
      AUTH_ERROR_CODES.DEPENDENCY_UNAVAILABLE,
      undefined,
      503,
      {
        source: 'auth_user_source',
        reason: error?.message || 'unknown'
      }
    );
  }
}
