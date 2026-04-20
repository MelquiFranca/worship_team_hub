import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../lib/api/auth.js';
import { jsonApiError } from '../../../lib/api/errors.js';
import { getTrimmedQueryParam, parseLimitParam, readJsonBody } from '../../../lib/api/request.js';
import { isPlainObject, normalizeIsoDate, normalizeString } from '../../../lib/api/validation.js';
import { getMongoCollections } from '../../../lib/db/mongodb.js';
import {
  parseScaleImageAttachmentInput,
  serializeScaleImageAttachment
} from '../../../lib/scales/imageAttachment.js';
import { getUnavailableComponentsForDate } from '../../../lib/scales/componentAvailability.js';
import {
  createInitialScalePushNotificationState,
  dispatchScalePushNotifications,
  serializeScalePushNotification
} from '../../../lib/notifications/scalePushNotifications.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const SCALE_TIME_SCOPE_CURRENT_AND_FUTURE = 'current-and-future';
const SCALE_TIME_SCOPE_ALL = 'all';
const SCALE_MESSAGE_TYPE_TEXT = 'text';

function getCurrentLocalIsoDate(now = new Date()) {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseScaleTimeScope(request) {
  const rawValue = getTrimmedQueryParam(request, 'timeScope');

  if (!rawValue) {
    return SCALE_TIME_SCOPE_CURRENT_AND_FUTURE;
  }

  if (rawValue === SCALE_TIME_SCOPE_CURRENT_AND_FUTURE || rawValue === SCALE_TIME_SCOPE_ALL) {
    return rawValue;
  }

  return null;
}

export function serializeScale(document) {
  return {
    id: document._id.toString(),
    groupId: document.groupId,
    date: document.date,
    shift: document.shift,
    imageAttachment: serializeScaleImageAttachment(document.imageAttachment),
    components: document.components || [],
    playlist: document.playlist || [],
    messages: normalizeScaleMessages(document.messages),
    playlistEditorComponentIds: document.playlistEditorComponentIds || [],
    imageEditorComponentIds: document.imageEditorComponentIds || [],
    notification: serializeScalePushNotification(document?.notifications?.push),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

export function normalizeScaleMessages(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!isPlainObject(entry)) {
        return null;
      }

      const id = normalizeString(entry.id);
      const type = normalizeString(entry.type) || SCALE_MESSAGE_TYPE_TEXT;
      const text = normalizeString(entry?.payload?.text);
      const authorId = normalizeString(entry?.meta?.authorId);
      const authorName = normalizeString(entry?.meta?.authorName);
      const createdAt = normalizeString(entry?.meta?.createdAt);
      const status = normalizeString(entry?.meta?.status) || 'sent';

      if (!id || type !== SCALE_MESSAGE_TYPE_TEXT || !text || !authorName || !createdAt) {
        return null;
      }

      return {
        id,
        type,
        payload: {
          text
        },
        meta: {
          authorId: authorId || 'unknown',
          authorName,
          createdAt,
          status
        }
      };
    })
    .filter(Boolean);
}

export function normalizeScaleComponents(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const seenIds = new Set();
  const items = [];

  for (const entry of value) {
    if (!isPlainObject(entry)) {
      return null;
    }

    const componentId = normalizeString(entry.componentId);
    const functionName = normalizeString(entry.function);

    if (!componentId || !functionName) {
      return null;
    }

    if (seenIds.has(componentId)) {
      return null;
    }

    seenIds.add(componentId);
    items.push({
      componentId,
      function: functionName
    });
  }

  return items;
}

export function normalizePlaylist(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const items = [];

  for (const entry of value) {
    if (!isPlainObject(entry)) {
      return null;
    }

    items.push({
      videoId: normalizeString(entry.videoId),
      title: normalizeString(entry.title),
      channelTitle: normalizeString(entry.channelTitle),
      url: normalizeString(entry.url),
      videoUrl: normalizeString(entry.videoUrl),
      thumbnailUrl: normalizeString(entry.thumbnailUrl)
    });
  }

  return items;
}

export function normalizePermissionComponentIds(value) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const seenIds = new Set();
  const ids = [];

  for (const entry of value) {
    const componentId = normalizeString(entry);

    if (!componentId || seenIds.has(componentId)) {
      return null;
    }

    seenIds.add(componentId);
    ids.push(componentId);
  }

  return ids;
}

function filterPermissionComponentIds(componentIds, allowedIds) {
  const allowedIdSet = new Set(allowedIds);
  return componentIds.filter((componentId) => allowedIdSet.has(componentId));
}

export async function GET(request) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel', 'group-app', 'component-app'])
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const limit = parseLimitParam(request);
    const timeScope = parseScaleTimeScope(request);

    if (limit === null && getTrimmedQueryParam(request, 'limit')) {
      return jsonApiError('Informe um limit entre 1 e 100.', 400, 'BAD_REQUEST');
    }

    if (timeScope === null) {
      return jsonApiError(
        'Informe um timeScope valido: current-and-future ou all.',
        400,
        'BAD_REQUEST'
      );
    }

    const { scales } = await getMongoCollections();
    const currentLocalIsoDate = getCurrentLocalIsoDate();
    const mongoFilter = timeScope === SCALE_TIME_SCOPE_ALL
      ? { groupId }
      : { groupId, date: { $gte: currentLocalIsoDate } };
    const query = scales.find(mongoFilter).sort({ date: -1, createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const items = (await query.toArray()).map(serializeScale);

    return NextResponse.json({
      items,
      count: items.length,
      groupId,
      filters: {
        timeScope,
        currentLocalIsoDate
      }
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel listar as escalas.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function POST(request) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de cadastro de escala e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const date = normalizeIsoDate(body.date);
    const shift = normalizeString(body.shift);
    const components = normalizeScaleComponents(body.components);
    const playlist = normalizePlaylist(body.playlist);
    const playlistEditorComponentIds = normalizePermissionComponentIds(body.playlistEditorComponentIds);
    const imageEditorComponentIds = normalizePermissionComponentIds(body.imageEditorComponentIds);
    const scaleId = crypto.randomUUID();
    const defaultSourceScaleLabel = `${date || ''} - ${shift || ''}`.trim();
    const imageAttachmentInput = parseScaleImageAttachmentInput(body, {
      allowRemoval: false,
      defaultSourceScaleId: scaleId,
      defaultSourceScaleLabel
    });

    if (!date || !shift || !components || playlist === null || playlistEditorComponentIds === null || imageEditorComponentIds === null) {
      return jsonApiError(
        'Informe date, shift, components e permissoes validas para cadastrar a escala.',
        400,
        'BAD_REQUEST'
      );
    }

    if (imageAttachmentInput.error) {
      return jsonApiError(imageAttachmentInput.error, 400, 'BAD_REQUEST');
    }

    const {
      scales,
      components: componentsCollection,
      scalePushNotificationDispatches
    } = await getMongoCollections();
    const componentIds = components.map((item) => item.componentId);
    const existingComponents = await componentsCollection
      .find({ groupId, _id: { $in: componentIds.map((componentId) => componentId) } })
      .project({ _id: 1, fullName: 1, username: 1, unavailableDates: 1 })
      .toArray();

    if (existingComponents.length !== componentIds.length) {
      return jsonApiError(
        'Um ou mais componentId informados nao pertencem ao grupo ou nao existem.',
        400,
        'BAD_REQUEST'
      );
    }

    const unavailableComponents = getUnavailableComponentsForDate(existingComponents, date);

    if (unavailableComponents.length > 0) {
      const componentNames = unavailableComponents.map((component) => component.name).join(', ');
      return jsonApiError(
        `Nao e possivel escalar componentes indisponiveis na data ${date}: ${componentNames}.`,
        400,
        'BAD_REQUEST'
      );
    }

    if (
      Array.isArray(playlistEditorComponentIds) &&
      (filterPermissionComponentIds(playlistEditorComponentIds, componentIds).length !== playlistEditorComponentIds.length)
    ) {
      return jsonApiError(
        'As permissoes de playlist e imagem precisam apontar para componentes selecionados na escala.',
        400,
        'BAD_REQUEST'
      );
    }

    if (
      Array.isArray(imageEditorComponentIds) &&
      filterPermissionComponentIds(imageEditorComponentIds, componentIds).length !== imageEditorComponentIds.length
    ) {
      return jsonApiError(
        'As permissoes de playlist e imagem precisam apontar para componentes selecionados na escala.',
        400,
        'BAD_REQUEST'
      );
    }

    const now = new Date().toISOString();
    const document = {
      _id: scaleId,
      groupId,
      date,
      shift,
      ...(imageAttachmentInput.imageAttachment ? { imageAttachment: imageAttachmentInput.imageAttachment } : {}),
      components,
      playlist,
      messages: [],
      playlistEditorComponentIds: playlistEditorComponentIds ?? [],
      imageEditorComponentIds: imageEditorComponentIds ?? [],
      notifications: {
        push: createInitialScalePushNotificationState()
      },
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

    const result = await scales.insertOne(document);
    const insertedScale = {
      ...document,
      _id: result.insertedId
    };
    let notificationDispatch = null;

    try {
      notificationDispatch = await dispatchScalePushNotifications({
        collections: { scales, components: componentsCollection, scalePushNotificationDispatches },
        scale: insertedScale,
        groupId,
        trigger: 'auto-create',
        actor: {
          userId: session.user.id,
          audience: session.claims.aud
        }
      });
    } catch (notificationError) {
      notificationDispatch = {
        trigger: 'auto-create',
        status: 'failed',
        message: 'A escala foi criada, mas ocorreu uma falha ao disparar a notificacao push.'
      };
    }

    const scaleWithNotifications = notificationDispatch?.notifications
      ? {
        ...insertedScale,
        notifications: {
          ...(isPlainObject(insertedScale.notifications) ? insertedScale.notifications : {}),
          push: notificationDispatch.notifications
        }
      }
      : insertedScale;

    return NextResponse.json(
      {
        message: 'Escala cadastrada com sucesso.',
        item: serializeScale(scaleWithNotifications),
        notification: notificationDispatch
      },
      { status: 201 }
    );
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel cadastrar a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
