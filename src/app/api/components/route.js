import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createPasswordHash, isAuthError, toAuthErrorResponse } from '../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../lib/api/auth.js';
import { jsonApiError } from '../../../lib/api/errors.js';
import {
  logBusinessEvent,
  logRequestFailed,
  logRequestSucceeded,
  startMonitoringContext
} from '../../../lib/api/monitoring.js';
import { getTrimmedQueryParam, parseLimitParam, readJsonBody } from '../../../lib/api/request.js';
import {
  isPlainObject,
  normalizeIsoDate,
  normalizeLowercaseString,
  normalizeString
} from '../../../lib/api/validation.js';
import { parseComponentPhotoInput } from '../../../lib/components/photo.js';
import {
  getComponentPhotoMongoProjection,
  serializeComponentPhotoFieldsForApi
} from '../../../lib/components/apiResponsePhoto.js';
import {
  normalizeUnavailabilityByDateInput,
  serializeUnavailableDates,
  serializeUnavailabilityByDate
} from '../../../lib/components/unavailability.js';
import { getMongoCollections } from '../../../lib/db/mongodb.js';
import {
  normalizePushTargetsInput,
  serializeComponentPushTargets
} from '../../../lib/notifications/pushTargets.js';
import { serializePushSubscriptions } from '../../../lib/notifications/pushSubscriptions.js';
import {
  normalizeCategoryTagIdsInput,
  resolveCategoryTagIdsFromSettingsDocument
} from '../../../lib/categories/tags.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_PERMISSION_TYPES = new Set(['admin-panel', 'group-app', 'component-app']);
const LEGACY_PERMISSION_TYPE_FALLBACK = 'component-app';

function resolveGroupIdForPermissionType(groupId, permissionType) {
  return permissionType === 'admin-panel' ? null : groupId;
}

function serializeComponent(document) {
  const permissionType = ALLOWED_PERMISSION_TYPES.has(document.permissionType)
    ? document.permissionType
    : LEGACY_PERMISSION_TYPE_FALLBACK;
  const pushTargets = serializeComponentPushTargets(document);
  const pushSubscriptions = serializePushSubscriptions(document.pushSubscriptions);
  const photoFields = serializeComponentPhotoFieldsForApi(document);
  const unavailableDates = serializeUnavailableDates(document, { futureOnly: true });
  const categoryTagIds = normalizeCategoryTagIdsInput(document?.categoryTagIds) || [];
  const unavailabilityByDate = serializeUnavailabilityByDate(document, {
    futureOnly: true,
    fallbackCategoryTagIds: categoryTagIds
  });

  return {
    id: document._id.toString(),
    groupId: resolveGroupIdForPermissionType(document.groupId, permissionType),
    fullName: document.fullName,
    birthDate: document.birthDate,
    username: document.username,
    permissionType,
    isActive: typeof document.isActive === 'boolean' ? document.isActive : true,
    photoUrl: photoFields.photoUrl,
    photoDataUrl: photoFields.photoDataUrl,
    photoProvided: photoFields.photoProvided,
    pushTargets,
    pushTargetCount: pushTargets.length,
    hasPushTargets: pushTargets.length > 0,
    pushSubscriptionCount: pushSubscriptions.length,
    hasPushSubscription: pushSubscriptions.length > 0,
    unavailableDates,
    categoryTagIds,
    unavailabilityByDate,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

function buildComponentPayload(body, groupId, allowedCategoryTagIds) {
  const fullName = normalizeString(body?.fullName);
  const birthDate = normalizeIsoDate(body?.birthDate);
  const username = normalizeString(body?.username);
  const password = typeof body?.password === 'string' ? body.password : '';
  const permissionType = normalizeString(body?.permissionType);
  const photoUrl = normalizeString(body?.photoUrl);
  const pushTargets = normalizePushTargetsInput(body?.pushTargets);
  const categoryTagIds = normalizeCategoryTagIdsInput(body?.categoryTagIds, { allowedCategoryTagIds });
  const unavailabilityByDate = normalizeUnavailabilityByDateInput(body?.unavailabilityByDate ?? [], {
    futureOnly: true,
    allowedCategoryTagIds
  });
  const photoInput = parseComponentPhotoInput(body, { allowRemoval: false });

  if (
    !fullName ||
    !birthDate ||
    !username ||
    !password.trim() ||
    !ALLOWED_PERMISSION_TYPES.has(permissionType) ||
    pushTargets === null ||
    !categoryTagIds ||
    unavailabilityByDate === null
  ) {
    return null;
  }

  if (photoInput.error) {
    return { error: photoInput.error };
  }

  return {
    groupId: resolveGroupIdForPermissionType(groupId, permissionType),
    fullName,
    birthDate,
    username,
    permissionType,
    normalizedUsername: normalizeLowercaseString(username),
    password,
    photoUrl,
    photo: photoInput.photo,
    photoProvided:
      photoInput.photoProvided ??
      Boolean(photoInput.photo || photoUrl || body?.photoProvided),
    pushTargets,
    categoryTagIds,
    unavailabilityByDate
  };
}

async function resolveGroupCategoryTagIds(groupSettingsCollection, groupId) {
  const settings = await groupSettingsCollection.findOne({ groupId }, { projection: { categoryTags: 1 } });
  return resolveCategoryTagIdsFromSettingsDocument(settings);
}

export async function GET(request) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel', 'group-app', 'component-app'])
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const limit = parseLimitParam(request);

    if (limit === null && getTrimmedQueryParam(request, 'limit')) {
      return jsonApiError('Informe um limit entre 1 e 100.', 400, 'BAD_REQUEST');
    }

    const { components, groupSettings } = await getMongoCollections();
    const allowedCategoryTagIds = await resolveGroupCategoryTagIds(groupSettings, groupId);
    const filter = { groupId };
    const query = components
      .find(filter, {
        projection: {
          _id: 1,
          groupId: 1,
          fullName: 1,
          birthDate: 1,
          username: 1,
          permissionType: 1,
          isActive: 1,
          pushTargets: 1,
          pushSubscriptions: 1,
          unavailableDates: 1,
          categoryTagIds: 1,
          unavailabilityByDate: 1,
          createdAt: 1,
          updatedAt: 1,
          ...getComponentPhotoMongoProjection()
        }
      })
      .sort({ createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const documents = await query.toArray();
    const migratedDocuments = documents.map((document) => {
      const hasStoredCategoryTagIds = Array.isArray(document?.categoryTagIds) && document.categoryTagIds.length > 0;
      const hasStoredUnavailabilityByDate = Array.isArray(document?.unavailabilityByDate);
      const categoryTagIds =
        normalizeCategoryTagIdsInput(document?.categoryTagIds, { allowedCategoryTagIds }) ||
        allowedCategoryTagIds;
      const unavailabilityByDate = serializeUnavailabilityByDate(document, {
        futureOnly: false,
        allowedCategoryTagIds,
        fallbackCategoryTagIds: categoryTagIds
      });

      return {
        ...document,
        categoryTagIds,
        unavailabilityByDate,
        __needsBackfill: !hasStoredCategoryTagIds || !hasStoredUnavailabilityByDate
      };
    });
    const items = migratedDocuments.map(serializeComponent);
    const backfillOperations = migratedDocuments
      .filter((document) => document.__needsBackfill)
      .map((document) =>
        components.updateOne(
          { _id: document._id, groupId },
          {
            $set: {
              categoryTagIds: document.categoryTagIds,
              unavailabilityByDate: document.unavailabilityByDate
            }
          }
        )
      );

    if (backfillOperations.length > 0) {
      await Promise.all(backfillOperations);
    }

    return NextResponse.json({ items, count: items.length, groupId });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel listar os componentes.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function POST(request) {
  const monitoringContext = startMonitoringContext({
    request,
    route: '/api/components',
    method: 'POST'
  });
  const body = await readJsonBody(request);
  const fail = (message, status, code, metadata = null) => {
    logRequestFailed(monitoringContext, {
      status,
      domain: 'components',
      severity: status >= 500 ? 'error' : 'warn',
      metadata: metadata || { code }
    });
    return jsonApiError(message, status, code);
  };

  if (!isPlainObject(body)) {
    return fail('A requisicao de cadastro de componente e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const { components, groupSettings } = await getMongoCollections();
    const allowedCategoryTagIds = await resolveGroupCategoryTagIds(groupSettings, groupId);

    if (Object.hasOwn(body, 'categoryTagIds') && session.claims.aud !== 'group-app') {
      return fail(
        'Somente usuarios group-app podem configurar categorias de tag de componentes.',
        403,
        'FORBIDDEN'
      );
    }

    const payload = buildComponentPayload(body, groupId, allowedCategoryTagIds);

    if (!payload) {
      return fail(
        'Informe fullName, birthDate, username, password, permissionType, categoryTagIds e pushTargets validos para continuar.',
        400,
        'BAD_REQUEST'
      );
    }

    if (payload.error) {
      return fail(payload.error, 400, 'BAD_REQUEST');
    }

    const existingComponent = await components.findOne({
      groupId: payload.groupId,
      normalizedUsername: payload.normalizedUsername
    });

    if (existingComponent) {
      return fail(
        'Ja existe um componente com esse username neste grupo.',
        409,
        'CONFLICT'
      );
    }

    const now = new Date().toISOString();
    const passwordHash = createPasswordHash(payload.password);
    const document = {
      _id: crypto.randomUUID(),
      groupId: payload.groupId,
      fullName: payload.fullName,
      birthDate: payload.birthDate,
      username: payload.username,
      normalizedUsername: payload.normalizedUsername,
      permissionType: payload.permissionType,
      isActive: true,
      passwordHash,
      photoUrl: payload.photoUrl,
      ...(payload.photo ? { photo: payload.photo } : {}),
      photoProvided: payload.photoProvided,
      pushTargets: payload.pushTargets,
      categoryTagIds: payload.categoryTagIds,
      unavailabilityByDate: payload.unavailabilityByDate,
      pushSubscriptions: [],
      createdAt: now,
      updatedAt: now,
      metadata: {
        createdByUserId: session.user.id,
        createdByAudience: session.claims.aud,
        updatedByUserId: session.user.id,
        updatedByAudience: session.claims.aud,
        source: 'api'
      }
    };

    const result = await components.insertOne(document);
    const insertedId = result.insertedId;

    logBusinessEvent(monitoringContext, {
      event: 'component_created',
      domain: 'components',
      status: 201,
      metadata: {
        componentId: insertedId,
        groupId: payload.groupId
      }
    });
    logRequestSucceeded(monitoringContext, {
      status: 201,
      domain: 'components',
      metadata: {
        componentId: insertedId
      }
    });

    return NextResponse.json(
      {
        message: 'Componente cadastrado com sucesso.',
        item: serializeComponent({
          ...document,
          _id: insertedId
        })
      },
      { status: 201 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      logRequestFailed(monitoringContext, {
        status: error?.status || 401,
        domain: 'components',
        severity: 'warn',
        metadata: { code: error?.code || 'AUTH_ERROR' }
      });
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.code === 11000) {
      return fail(
        'Ja existe um componente com esse username neste grupo.',
        409,
        'CONFLICT'
      );
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return fail('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return fail('Nao foi possivel cadastrar o componente.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
