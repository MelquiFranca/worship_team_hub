import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { getTrimmedQueryParam, readJsonBody } from '../../../../lib/api/request.js';
import { isPlainObject, normalizeString } from '../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../lib/db/mongodb.js';
import {
  normalizePushSubscription,
  serializePushSubscriptions
} from '../../../../lib/notifications/pushSubscriptions.js';
import { resolveSessionComponent } from '../../../../lib/notifications/resolveSessionComponent.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUSH_SUBSCRIBE_ALLOWED_AUDIENCES = new Set(['component-app', 'group-app']);

function mergePushSubscriptions(currentSubscriptions, nextSubscription) {
  const nextEndpoint = normalizeString(nextSubscription?.endpoint);

  if (!nextEndpoint) {
    return serializePushSubscriptions(currentSubscriptions);
  }

  const cleanedCurrent = serializePushSubscriptions(currentSubscriptions).filter(
    (subscription) => normalizeString(subscription?.endpoint) !== nextEndpoint
  );

  return serializePushSubscriptions([nextSubscription, ...cleanedCurrent]);
}

export async function POST(request) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de subscription push e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: PUSH_SUBSCRIBE_ALLOWED_AUDIENCES
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const subscription = normalizePushSubscription(body.subscription);

    if (!subscription) {
      return jsonApiError('Informe subscription valida para registrar push.', 400, 'BAD_REQUEST');
    }

    const { components } = await getMongoCollections();
    const sessionUserId = normalizeString(session.user?.id);
    const componentById = sessionUserId
      ? await components.findOne({ _id: sessionUserId, groupId })
      : null;
    const component = componentById || (await resolveSessionComponent(components, groupId, session.user));

    if (!component?._id) {
      return jsonApiError('Nao foi possivel identificar o componente da sessao para registrar push.', 404, 'NOT_FOUND');
    }

    const existingComponent = await components.findOne({ _id: component._id, groupId });

    if (!existingComponent) {
      return jsonApiError('Componente nao encontrado para este grupo.', 404, 'NOT_FOUND');
    }

    const nextSubscriptions = mergePushSubscriptions(existingComponent.pushSubscriptions, subscription);
    const now = new Date().toISOString();

    await components.updateOne(
      { _id: component._id, groupId },
      {
        $set: {
          pushSubscriptions: nextSubscriptions,
          updatedAt: now,
          'metadata.updatedByUserId': session.user.id,
          'metadata.updatedByAudience': session.claims.aud,
          'metadata.source': 'push-subscribe-api'
        }
      }
    );

    return NextResponse.json({
      message: 'Subscription push registrada com sucesso.',
      componentId: component._id,
      pushSubscriptionCount: nextSubscriptions.length
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel registrar a subscription push.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
