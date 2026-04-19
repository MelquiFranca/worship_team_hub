import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../../lib/api/errors.js';
import { getTrimmedQueryParam, readJsonBody } from '../../../../../lib/api/request.js';
import { isPlainObject, normalizeString } from '../../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../../lib/db/mongodb.js';
import { resolveSessionComponent } from '../../../../../lib/notifications/resolveSessionComponent.js';
import { dispatchScaleChatMessagePushNotifications } from '../../../../../lib/notifications/scalePushNotifications.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHAT_ALLOWED_AUDIENCES = new Set(['admin-panel', 'group-app', 'component-app']);
const MAX_MESSAGE_LENGTH = 1200;

function getScaleIdFromParams(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  return normalizeString(params.scaleId);
}

function resolveAuthorFallbackName(user) {
  return (
    normalizeString(user?.displayName) ||
    normalizeString(user?.name) ||
    normalizeString(user?.username) ||
    normalizeString(user?.identifier) ||
    normalizeString(user?.email) ||
    'Usuario'
  );
}

function isParticipantComponentId(componentIds, componentId) {
  if (!Array.isArray(componentIds)) {
    return false;
  }

  return componentIds.includes(componentId);
}

export async function POST(request, { params }) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de envio de mensagem e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: CHAT_ALLOWED_AUDIENCES
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const scaleId = getScaleIdFromParams(params);
    const text = normalizeString(body.text);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    if (!text) {
      return jsonApiError('Informe text valido para enviar a mensagem.', 400, 'BAD_REQUEST');
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      return jsonApiError(`A mensagem deve ter no maximo ${MAX_MESSAGE_LENGTH} caracteres.`, 400, 'BAD_REQUEST');
    }

    const { scales, components, scalePushNotificationDispatches } = await getMongoCollections();
    const scale = await scales.findOne({ _id: scaleId, groupId });

    if (!scale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    const participantComponentIds = Array.isArray(scale.components)
      ? scale.components
        .map((entry) => normalizeString(entry?.componentId))
        .filter(Boolean)
      : [];
    const resolvedAuthorComponent = await resolveSessionComponent(components, groupId, session.user);
    const authorComponent = resolvedAuthorComponent?._id ? resolvedAuthorComponent : null;

    const now = new Date().toISOString();
    const message = {
      id: crypto.randomUUID(),
      type: 'text',
      payload: {
        text
      },
      meta: {
        authorId: authorComponent?._id || normalizeString(session.user?.id) || 'unknown',
        authorName: normalizeString(authorComponent?.fullName) || resolveAuthorFallbackName(session.user),
        createdAt: now,
        status: 'sent'
      }
    };

    await scales.updateOne(
      { _id: scaleId, groupId },
      {
        $push: {
          messages: message
        },
        $set: {
          updatedAt: now,
          'metadata.updatedByUserId': session.user.id,
          'metadata.updatedByAudience': session.claims.aud,
          'metadata.source': 'api-chat-message'
        }
      }
    );

    let notificationDispatch = null;

    try {
      notificationDispatch = await dispatchScaleChatMessagePushNotifications({
        collections: { components, scalePushNotificationDispatches },
        scale,
        groupId,
        message,
        excludeComponentIds:
          authorComponent?._id && isParticipantComponentId(participantComponentIds, authorComponent._id)
            ? [authorComponent._id]
            : [],
        actor: {
          userId: session.user.id,
          audience: session.claims.aud
        }
      });
    } catch (notificationError) {
      notificationDispatch = {
        status: 'failed',
        message: 'A mensagem foi enviada, mas ocorreu uma falha ao disparar a notificacao push.'
      };
    }

    return NextResponse.json(
      {
        message: 'Mensagem enviada com sucesso.',
        item: message,
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

    return jsonApiError('Nao foi possivel enviar a mensagem da escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
