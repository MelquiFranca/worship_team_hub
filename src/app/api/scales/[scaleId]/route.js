import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { getTrimmedQueryParam, readJsonBody } from '../../../../lib/api/request.js';
import { isPlainObject, normalizeIsoDate, normalizeString } from '../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../lib/db/mongodb.js';
import { normalizePlaylist, normalizeScaleComponents, serializeScale } from '../route.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getScaleIdFromParams(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }

  return normalizeString(params.scaleId);
}

function buildScalePatchPayload(body) {
  const updates = {};

  if (Object.hasOwn(body, 'date')) {
    const date = normalizeIsoDate(body.date);

    if (!date) {
      return { error: 'Informe date no formato YYYY-MM-DD.' };
    }

    updates.date = date;
  }

  if (Object.hasOwn(body, 'shift')) {
    const shift = normalizeString(body.shift);

    if (!shift) {
      return { error: 'Informe shift valido para continuar.' };
    }

    updates.shift = shift;
  }

  if (Object.hasOwn(body, 'components')) {
    const components = normalizeScaleComponents(body.components);

    if (!components) {
      return { error: 'Informe components validos para continuar.' };
    }

    updates.components = components;
  }

  if (Object.hasOwn(body, 'playlist')) {
    const playlist = normalizePlaylist(body.playlist);

    if (playlist === null) {
      return { error: 'Informe playlist valida para continuar.' };
    }

    updates.playlist = playlist;
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Informe ao menos um campo valido para atualizacao.' };
  }

  return { updates };
}

export async function GET(request, { params }) {
  try {
    const session = requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const scaleId = getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { scales } = await getMongoCollections();
    const scale = await scales.findOne({ _id: scaleId, groupId });

    if (!scale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({ item: serializeScale(scale) });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request, { params }) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de edicao de escala e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const scaleId = getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const parsed = buildScalePatchPayload(body);

    if (parsed.error) {
      return jsonApiError(parsed.error, 400, 'BAD_REQUEST');
    }

    const { scales, components } = await getMongoCollections();
    const existingScale = await scales.findOne({ _id: scaleId, groupId });

    if (!existingScale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    if (Object.hasOwn(parsed.updates, 'components')) {
      const componentIds = parsed.updates.components.map((item) => item.componentId);
      const existingComponents = await components
        .find({ groupId, _id: { $in: componentIds.map((componentId) => componentId) } })
        .project({ _id: 1 })
        .toArray();

      if (existingComponents.length !== componentIds.length) {
        return jsonApiError(
          'Um ou mais componentId informados nao pertencem ao grupo ou nao existem.',
          400,
          'BAD_REQUEST'
        );
      }
    }

    const nextDate = parsed.updates.date || existingScale.date;
    const nextShift = parsed.updates.shift || existingScale.shift;
    const isDateOrShiftChanging = nextDate !== existingScale.date || nextShift !== existingScale.shift;

    if (isDateOrShiftChanging) {
      const duplicateScale = await scales.findOne({
        _id: { $ne: scaleId },
        groupId,
        date: nextDate,
        shift: nextShift
      });

      if (duplicateScale) {
        return jsonApiError('Ja existe uma escala com esta data e turno neste grupo.', 409, 'CONFLICT');
      }
    }

    const now = new Date().toISOString();
    const nextMetadata = {
      ...(isPlainObject(existingScale.metadata) ? existingScale.metadata : {}),
      updatedByUserId: session.user.id,
      updatedByAudience: session.claims.aud,
      source: 'api'
    };

    const updatePayload = {
      ...parsed.updates,
      updatedAt: now,
      metadata: nextMetadata
    };

    await scales.updateOne(
      { _id: scaleId, groupId },
      { $set: updatePayload }
    );

    const updatedScale = await scales.findOne({ _id: scaleId, groupId });

    if (!updatedScale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({
      message: 'Escala atualizada com sucesso.',
      item: serializeScale(updatedScale)
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.code === 11000) {
      return jsonApiError('Ja existe uma escala com esta data e turno neste grupo.', 409, 'CONFLICT');
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel atualizar a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const scaleId = getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { scales } = await getMongoCollections();
    const result = await scales.deleteOne({ _id: scaleId, groupId });

    if (!result.deletedCount) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({ message: 'Escala excluida com sucesso.' });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel excluir a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
