import { NextResponse } from 'next/server';
import { createPasswordHash, isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { getTrimmedQueryParam, readJsonBody } from '../../../../lib/api/request.js';
import {
  isPlainObject,
  normalizeIsoDate,
  normalizeLowercaseString,
  normalizeString
} from '../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../lib/db/mongodb.js';
import {
  normalizePushTargetsInput,
  serializeComponentPushTargets
} from '../../../../lib/notifications/pushTargets.js';
import {
  normalizePushSubscriptionsInput,
  serializePushSubscriptions
} from '../../../../lib/notifications/pushSubscriptions.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PERMISSION_TYPES = new Set(['admin-panel', 'group-app', 'component-app']);
const LEGACY_PERMISSION_TYPE_FALLBACK = 'component-app';

function serializeComponent(document) {
  const permissionType = ALLOWED_PERMISSION_TYPES.has(document.permissionType)
    ? document.permissionType
    : LEGACY_PERMISSION_TYPE_FALLBACK;
  const pushTargets = serializeComponentPushTargets(document);
  const pushSubscriptions = serializePushSubscriptions(document.pushSubscriptions);

  return {
    id: document._id.toString(),
    groupId: document.groupId,
    fullName: document.fullName,
    birthDate: document.birthDate,
    username: document.username,
    permissionType,
    isActive: typeof document.isActive === 'boolean' ? document.isActive : true,
    photoUrl: document.photoUrl || '',
    photoProvided: Boolean(document.photoProvided),
    pushTargets,
    pushTargetCount: pushTargets.length,
    hasPushTargets: pushTargets.length > 0,
    pushSubscriptionCount: pushSubscriptions.length,
    hasPushSubscription: pushSubscriptions.length > 0,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

function getComponentIdFromParams(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  return normalizeString(params.componentId);
}

function buildPatchPayload(body) {
  const updates = {};

  if (Object.hasOwn(body, 'fullName')) {
    const fullName = normalizeString(body.fullName);

    if (!fullName) {
      return { error: 'Informe fullName valido para continuar.' };
    }

    updates.fullName = fullName;
  }

  if (Object.hasOwn(body, 'birthDate')) {
    const birthDate = normalizeIsoDate(body.birthDate);

    if (!birthDate) {
      return { error: 'Informe birthDate no formato YYYY-MM-DD.' };
    }

    updates.birthDate = birthDate;
  }

  if (Object.hasOwn(body, 'username')) {
    const username = normalizeString(body.username);

    if (!username) {
      return { error: 'Informe username valido para continuar.' };
    }

    updates.username = username;
    updates.normalizedUsername = normalizeLowercaseString(username);
  }

  if (Object.hasOwn(body, 'permissionType')) {
    const permissionType = normalizeString(body.permissionType);

    if (!ALLOWED_PERMISSION_TYPES.has(permissionType)) {
      return { error: 'Informe permissionType valido para continuar.' };
    }

    updates.permissionType = permissionType;
  }

  if (Object.hasOwn(body, 'photoUrl')) {
    updates.photoUrl = normalizeString(body.photoUrl);
  }

  if (Object.hasOwn(body, 'photoProvided')) {
    if (typeof body.photoProvided !== 'boolean') {
      return { error: 'Informe photoProvided como booleano.' };
    }

    updates.photoProvided = body.photoProvided;
  }

  if (Object.hasOwn(body, 'pushTargets')) {
    const pushTargets = normalizePushTargetsInput(body.pushTargets);

    if (pushTargets === null) {
      return { error: 'Informe pushTargets como string ou lista de strings.' };
    }

    updates.pushTargets = pushTargets;
  }

  if (Object.hasOwn(body, 'pushSubscriptions')) {
    const pushSubscriptions = normalizePushSubscriptionsInput(body.pushSubscriptions);

    if (pushSubscriptions === null) {
      return { error: 'Informe pushSubscriptions como lista valida de subscriptions web push.' };
    }

    updates.pushSubscriptions = pushSubscriptions;
  }

  if (Object.hasOwn(body, 'isActive')) {
    if (typeof body.isActive !== 'boolean') {
      return { error: 'Informe isActive como booleano.' };
    }

    updates.isActive = body.isActive;
  }

  if (Object.hasOwn(body, 'password')) {
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password.trim()) {
      return { error: 'Informe password valido para continuar.' };
    }

    updates.passwordHash = createPasswordHash(password);
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Informe ao menos um campo valido para atualizacao.' };
  }

  return { updates };
}

export async function GET(request, { params }) {
  try {
    const session = await requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const componentId = getComponentIdFromParams(params);

    if (!componentId) {
      return jsonApiError('Informe componentId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { components } = await getMongoCollections();
    const component = await components.findOne({ _id: componentId, groupId });

    if (!component) {
      return jsonApiError('Componente nao encontrado para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({ item: serializeComponent(component) });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar o componente.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request, { params }) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de edicao de componente e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const componentId = getComponentIdFromParams(params);

    if (!componentId) {
      return jsonApiError('Informe componentId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const parsed = buildPatchPayload(body);

    if (parsed.error) {
      return jsonApiError(parsed.error, 400, 'BAD_REQUEST');
    }

    const { components } = await getMongoCollections();
    const existingComponent = await components.findOne({ _id: componentId, groupId });

    if (!existingComponent) {
      return jsonApiError('Componente nao encontrado para este grupo.', 404, 'NOT_FOUND');
    }

    if (Object.hasOwn(parsed.updates, 'normalizedUsername')) {
      const duplicateUsername = await components.findOne({
        _id: { $ne: componentId },
        groupId,
        normalizedUsername: parsed.updates.normalizedUsername
      });

      if (duplicateUsername) {
        return jsonApiError(
          'Ja existe um componente com esse username neste grupo.',
          409,
          'CONFLICT'
        );
      }
    }

    const now = new Date().toISOString();
    const nextMetadata = {
      ...(isPlainObject(existingComponent.metadata) ? existingComponent.metadata : {}),
      updatedByUserId: session.user.id,
      updatedByAudience: session.claims.aud,
      source: 'api'
    };

    const updatePayload = {
      ...parsed.updates,
      updatedAt: now,
      metadata: nextMetadata
    };

    await components.updateOne(
      { _id: componentId, groupId },
      { $set: updatePayload }
    );

    const updatedComponent = await components.findOne({ _id: componentId, groupId });

    if (!updatedComponent) {
      return jsonApiError('Componente nao encontrado para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({
      message: 'Componente atualizado com sucesso.',
      item: serializeComponent(updatedComponent)
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.code === 11000) {
      return jsonApiError(
        'Ja existe um componente com esse username neste grupo.',
        409,
        'CONFLICT'
      );
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel atualizar o componente.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
