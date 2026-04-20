import { authUsers as seededAuthUsers } from '../../data/authUsers.js';
import { readJsonBody } from '../api/request.js';
import { isPlainObject, normalizeString } from '../api/validation.js';
import { parseComponentPhotoInput, serializeComponentPhoto } from '../components/photo.js';
import { getMongoCollections } from '../db/mongodb.js';
import { createPasswordHash, verifyPassword } from './password.js';
import { AUTH_AUDIENCES, AUTH_COOKIE_NAMES } from './constants.js';
import { AUTH_ERROR_CODES, createAuthError } from './errors.js';
import { verifyAccessSession } from './service.js';
import { loadAuthUsers } from './userSource.js';

const PROFILE_ALLOWED_AUDIENCES = new Set(['admin-panel', 'group-app', 'component-app']);
const SEEDED_USER_IDS = new Set(
  (Array.isArray(seededAuthUsers) ? seededAuthUsers : [])
    .map((user) => (typeof user?.id === 'string' ? user.id.trim() : ''))
    .filter(Boolean)
);

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return authorization.slice(7).trim();
}

function getAccessTokenFromRequest(request) {
  return (
    request.cookies?.get(AUTH_COOKIE_NAMES.accessToken)?.value?.trim() ||
    getBearerToken(request)
  );
}

function getProfileIdentifier(user) {
  return normalizeString(user?.identifier || user?.username || user?.email);
}

function serializeProfilePhoto(document) {
  const photoDataUrl = serializeComponentPhoto(document);

  return {
    photoDataUrl: normalizeString(photoDataUrl),
    photoUrl: normalizeString(document?.photoUrl)
  };
}

function serializeCurrentProfile(user, claims, sourceDocument) {
  const profilePhoto = serializeProfilePhoto(sourceDocument);

  return {
    id: user?.id || '',
    name: normalizeString(user?.name),
    identifier: getProfileIdentifier(user),
    role: normalizeString(user?.role),
    audience: normalizeString(claims?.aud),
    groupId: normalizeString(user?.groupId) || null,
    photoDataUrl: profilePhoto.photoDataUrl,
    photoUrl: profilePhoto.photoUrl
  };
}

function buildPhotoUpdates(photoInput) {
  const updates = {};
  const unset = {};

  if (photoInput?.error) {
    return { error: photoInput.error };
  }

  if (photoInput?.removePhoto) {
    unset.photo = '';
    updates.photoUrl = '';
    updates.photoProvided = false;
  }

  if (photoInput?.photo) {
    updates.photo = photoInput.photo;
    updates.photoProvided = true;
  }

  if (photoInput?.photoUrl !== undefined) {
    updates.photoUrl = photoInput.photoUrl;
  }

  if (photoInput?.photoProvided !== undefined && !photoInput?.removePhoto && !photoInput?.photo) {
    updates.photoProvided = photoInput.photoProvided;
  }

  return { updates, unset };
}

function parsePasswordChangeInput(body) {
  const hasCurrentPassword = Object.hasOwn(body, 'currentPassword');
  const hasNewPassword = Object.hasOwn(body, 'newPassword');

  if (!hasCurrentPassword && !hasNewPassword) {
    return { hasPasswordUpdate: false };
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!currentPassword.trim()) {
    return { error: 'Informe currentPassword valido para continuar.' };
  }

  if (!newPassword.trim()) {
    return { error: 'Informe newPassword valido para continuar.' };
  }

  return {
    hasPasswordUpdate: true,
    currentPassword,
    newPassword
  };
}

function buildProfilePatchInput(body) {
  const photoInput = parseComponentPhotoInput(body, { allowRemoval: true });
  const parsedPassword = parsePasswordChangeInput(body);

  if (parsedPassword.error) {
    return { error: parsedPassword.error };
  }

  const parsedPhoto = buildPhotoUpdates(photoInput);

  if (parsedPhoto.error) {
    return { error: parsedPhoto.error };
  }

  return {
    updates: parsedPhoto.updates,
    unset: parsedPhoto.unset,
    passwordInput: parsedPassword
  };
}

async function getSeedUserOverride(authUserOverrides, userId) {
  return authUserOverrides.findOne({ userId });
}

async function getComponentProfileDocument(components, user, claims) {
  const filter = {
    _id: user.id
  };

  if (normalizeString(claims?.groupId)) {
    filter.groupId = normalizeString(claims.groupId);
  }

  return components.findOne(filter);
}

export async function requireProfileAccessSession(request) {
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    throw createAuthError(AUTH_ERROR_CODES.TOKEN_MISSING, undefined, 401);
  }

  const authUsers = await loadAuthUsers();
  const session = verifyAccessSession(authUsers, accessToken);

  if (!PROFILE_ALLOWED_AUDIENCES.has(session.claims.aud) || !AUTH_AUDIENCES.includes(session.claims.aud)) {
    throw createAuthError(
      AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN,
      'A audiencia informada nao tem acesso a esta operacao.',
      403,
      { audience: session.claims.aud }
    );
  }

  return session;
}

export async function getCurrentAuthProfile(session) {
  const { components, authUserOverrides } = await getMongoCollections();

  if (SEEDED_USER_IDS.has(session.user.id)) {
    const override = await getSeedUserOverride(authUserOverrides, session.user.id);
    return serializeCurrentProfile(session.user, session.claims, override);
  }

  const component = await getComponentProfileDocument(components, session.user, session.claims);

  if (!component) {
    return serializeCurrentProfile(session.user, session.claims, null);
  }

  return serializeCurrentProfile(session.user, session.claims, component);
}

export async function updateCurrentAuthProfile(session, body) {
  if (!isPlainObject(body)) {
    return { error: 'A requisicao de atualizacao de perfil e invalida.' };
  }

  const parsed = buildProfilePatchInput(body);

  if (parsed.error) {
    return { error: parsed.error };
  }

  const { components, authUserOverrides } = await getMongoCollections();
  const now = new Date().toISOString();
  const nextUpdates = {
    ...parsed.updates,
    updatedAt: now
  };
  const nextUnset = { ...parsed.unset };

  if (SEEDED_USER_IDS.has(session.user.id)) {
    const baseUser = (Array.isArray(seededAuthUsers) ? seededAuthUsers : []).find((user) => user.id === session.user.id);

    if (!baseUser) {
      return { error: 'Usuario da sessao nao encontrado.', status: 404, code: 'NOT_FOUND' };
    }

    const override = await getSeedUserOverride(authUserOverrides, session.user.id);

    if (parsed.passwordInput.hasPasswordUpdate) {
      const currentPasswordHash = normalizeString(override?.passwordHash) || normalizeString(baseUser.passwordHash);

      if (!verifyPassword(parsed.passwordInput.currentPassword, currentPasswordHash)) {
        return { error: 'Senha atual invalida.' };
      }

      nextUpdates.passwordHash = createPasswordHash(parsed.passwordInput.newPassword);
    }

    if (Object.keys(nextUpdates).length === 1 && Object.keys(nextUnset).length === 0) {
      return { error: 'Informe ao menos um campo valido para atualizacao.' };
    }

    const updateDocument = {
      $set: {
        ...nextUpdates,
        userId: session.user.id
      },
      $setOnInsert: {
        createdAt: now
      }
    };

    if (Object.keys(nextUnset).length > 0) {
      updateDocument.$unset = nextUnset;
    }

    await authUserOverrides.updateOne({ userId: session.user.id }, updateDocument, { upsert: true });

    const updatedOverride = await getSeedUserOverride(authUserOverrides, session.user.id);

    return {
      item: serializeCurrentProfile(session.user, session.claims, updatedOverride)
    };
  }

  const component = await getComponentProfileDocument(components, session.user, session.claims);

  if (!component) {
    return { error: 'Componente nao encontrado para esta sessao.', status: 404, code: 'NOT_FOUND' };
  }

  if (parsed.passwordInput.hasPasswordUpdate) {
    const currentPasswordHash = normalizeString(component.passwordHash);

    if (!currentPasswordHash || !verifyPassword(parsed.passwordInput.currentPassword, currentPasswordHash)) {
      return { error: 'Senha atual invalida.' };
    }

    nextUpdates.passwordHash = createPasswordHash(parsed.passwordInput.newPassword);
  }

  if (Object.keys(nextUpdates).length === 1 && Object.keys(nextUnset).length === 0) {
    return { error: 'Informe ao menos um campo valido para atualizacao.' };
  }

  const updateDocument = Object.keys(nextUnset).length > 0
    ? { $set: nextUpdates, $unset: nextUnset }
    : { $set: nextUpdates };

  await components.updateOne({ _id: component._id }, updateDocument);

  const updatedComponent = await getComponentProfileDocument(components, session.user, session.claims);

  return {
    item: serializeCurrentProfile(session.user, session.claims, updatedComponent)
  };
}

export async function readProfilePatchBody(request) {
  return readJsonBody(request);
}
