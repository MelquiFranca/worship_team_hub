import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../../lib/api/errors.js';
import { getTrimmedQueryParam } from '../../../../../lib/api/request.js';
import { normalizeString } from '../../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../../lib/db/mongodb.js';
import { dispatchScalePushNotifications } from '../../../../../lib/notifications/scalePushNotifications.js';
import { serializeScale } from '../../route.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NOTIFY_ALLOWED_AUDIENCES = new Set(['admin-panel', 'group-app', 'component-app']);

function getScaleIdFromParams(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  return normalizeString(params.scaleId);
}

export async function POST(request, { params }) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: NOTIFY_ALLOWED_AUDIENCES
    });

    if (session.claims.aud === 'component-app') {
      return jsonApiError(
        'Seu perfil nao possui permissao para reenviar notificacoes da escala.',
        403,
        'FORBIDDEN'
      );
    }

    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const scaleId = getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { scales, components, scalePushNotificationDispatches } = await getMongoCollections();
    const existingScale = await scales.findOne({ _id: scaleId, groupId });

    if (!existingScale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    const notificationDispatch = await dispatchScalePushNotifications({
      collections: { scales, components, scalePushNotificationDispatches },
      scale: existingScale,
      groupId,
      trigger: 'manual-resend',
      actor: {
        userId: session.user.id,
        audience: session.claims.aud
      }
    });
    const updatedScale = {
      ...existingScale,
      notifications: {
        ...(existingScale.notifications && typeof existingScale.notifications === 'object'
          ? existingScale.notifications
          : {}),
        push: notificationDispatch.notifications
      }
    };

    return NextResponse.json({
      message: 'Notificacao reenviada com sucesso.',
      item: serializeScale(updatedScale),
      notification: notificationDispatch
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel reenviar a notificacao da escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
