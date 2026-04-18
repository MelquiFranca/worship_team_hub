import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../lib/api/auth.js';
import { jsonApiError } from '../../../lib/api/errors.js';
import { getTrimmedQueryParam, parseLimitParam, readJsonBody } from '../../../lib/api/request.js';
import { isPlainObject, normalizeIsoDate, normalizeString } from '../../../lib/api/validation.js';
import { getMongoCollections } from '../../../lib/db/mongodb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function serializeScale(document) {
  return {
    id: document._id.toString(),
    groupId: document.groupId,
    date: document.date,
    shift: document.shift,
    components: document.components || [],
    playlist: document.playlist || [],
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
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

export async function GET(request) {
  try {
    const session = requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const limit = parseLimitParam(request);

    if (limit === null && getTrimmedQueryParam(request, 'limit')) {
      return jsonApiError('Informe um limit entre 1 e 100.', 400, 'BAD_REQUEST');
    }

    const { scales } = await getMongoCollections();
    const query = scales.find({ groupId }).sort({ date: -1, createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const items = (await query.toArray()).map(serializeScale);

    return NextResponse.json({ items, count: items.length, groupId });
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
    const session = requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const date = normalizeIsoDate(body.date);
    const shift = normalizeString(body.shift);
    const components = normalizeScaleComponents(body.components);
    const playlist = normalizePlaylist(body.playlist);

    if (!date || !shift || !components || playlist === null) {
      return jsonApiError(
        'Informe date, shift e components validos para cadastrar a escala.',
        400,
        'BAD_REQUEST'
      );
    }

    const { scales, components: componentsCollection } = await getMongoCollections();
    const componentIds = components.map((item) => item.componentId);
    const existingComponents = await componentsCollection
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

    const now = new Date().toISOString();
    const document = {
      _id: crypto.randomUUID(),
      groupId,
      date,
      shift,
      components,
      playlist,
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

    return NextResponse.json(
      {
        message: 'Escala cadastrada com sucesso.',
        item: serializeScale({
          ...document,
          _id: result.insertedId
        })
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
