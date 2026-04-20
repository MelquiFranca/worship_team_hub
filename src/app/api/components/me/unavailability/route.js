import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../../lib/api/errors.js';
import { readJsonBody } from '../../../../../lib/api/request.js';
import { isPlainObject } from '../../../../../lib/api/validation.js';
import {
  normalizeUnavailableDatesInput,
  serializeUnavailableDates
} from '../../../../../lib/components/unavailability.js';
import { getMongoCollections } from '../../../../../lib/db/mongodb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializePayload(document) {
  return {
    componentId: document._id.toString(),
    unavailableDates: serializeUnavailableDates(document, { futureOnly: true }),
    updatedAt: document.updatedAt
  };
}

export async function GET(request) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['component-app'])
    });
    const groupId = resolveRequestGroupId(session.claims);
    const componentId = typeof session.user?.id === 'string' ? session.user.id.trim() : '';

    if (!componentId) {
      return jsonApiError('Nao foi possivel identificar o componente da sessao.', 401, 'TOKEN_INVALID');
    }

    const { components } = await getMongoCollections();
    const component = await components.findOne({ _id: componentId, groupId, isActive: { $ne: false } });

    if (!component) {
      return jsonApiError('Componente nao encontrado para esta sessao.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({ item: serializePayload(component) });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar a indisponibilidade do componente.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de indisponibilidade e invalida.', 400, 'BAD_REQUEST');
  }

  const unavailableDates = normalizeUnavailableDatesInput(body.unavailableDates, { futureOnly: true });

  if (unavailableDates === null) {
    return jsonApiError(
      'Informe unavailableDates com uma lista de datas futuras no formato YYYY-MM-DD.',
      400,
      'BAD_REQUEST'
    );
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['component-app'])
    });
    const groupId = resolveRequestGroupId(session.claims);
    const componentId = typeof session.user?.id === 'string' ? session.user.id.trim() : '';

    if (!componentId) {
      return jsonApiError('Nao foi possivel identificar o componente da sessao.', 401, 'TOKEN_INVALID');
    }

    const now = new Date().toISOString();
    const { components } = await getMongoCollections();
    const current = await components.findOne({ _id: componentId, groupId, isActive: { $ne: false } });

    if (!current) {
      return jsonApiError('Componente nao encontrado para esta sessao.', 404, 'NOT_FOUND');
    }

    const nextMetadata = {
      ...(isPlainObject(current.metadata) ? current.metadata : {}),
      updatedByUserId: session.user.id,
      updatedByAudience: session.claims.aud,
      source: 'api'
    };

    await components.updateOne(
      { _id: componentId, groupId },
      {
        $set: {
          unavailableDates,
          updatedAt: now,
          metadata: nextMetadata
        }
      }
    );

    const updated = await components.findOne({ _id: componentId, groupId });

    if (!updated) {
      return jsonApiError('Componente nao encontrado para esta sessao.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({
      message: 'Dias indisponiveis atualizados com sucesso.',
      item: serializePayload(updated)
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel atualizar a indisponibilidade do componente.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
