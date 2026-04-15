import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createPasswordHash, isAuthError, toAuthErrorResponse } from '../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../lib/api/auth.js';
import { jsonApiError } from '../../../lib/api/errors.js';
import { getTrimmedQueryParam, parseLimitParam, readJsonBody } from '../../../lib/api/request.js';
import {
  isPlainObject,
  normalizeIsoDate,
  normalizeLowercaseString,
  normalizeString
} from '../../../lib/api/validation.js';
import { getMongoCollections } from '../../../lib/db/mongodb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeComponent(document) {
  return {
    id: document._id.toString(),
    groupId: document.groupId,
    fullName: document.fullName,
    birthDate: document.birthDate,
    username: document.username,
    photoUrl: document.photoUrl || '',
    photoProvided: Boolean(document.photoProvided),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

function buildComponentPayload(body, groupId) {
  const fullName = normalizeString(body?.fullName);
  const birthDate = normalizeIsoDate(body?.birthDate);
  const username = normalizeString(body?.username);
  const password = typeof body?.password === 'string' ? body.password : '';
  const photoUrl = normalizeString(body?.photoUrl);
  const photoProvided = Boolean(body?.photoProvided);

  if (!fullName || !birthDate || !username || !password.trim()) {
    return null;
  }

  return {
    groupId,
    fullName,
    birthDate,
    username,
    normalizedUsername: normalizeLowercaseString(username),
    password,
    photoUrl,
    photoProvided
  };
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

    const { components } = await getMongoCollections();
    const filter = { groupId };
    const query = components.find(filter).sort({ createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const items = (await query.toArray()).map(serializeComponent);

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
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de cadastro de componente e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const payload = buildComponentPayload(body, groupId);

    if (!payload) {
      return jsonApiError(
        'Informe fullName, birthDate, username e password para continuar.',
        400,
        'BAD_REQUEST'
      );
    }

    const { components } = await getMongoCollections();
    const existingComponent = await components.findOne({
      groupId: payload.groupId,
      normalizedUsername: payload.normalizedUsername
    });

    if (existingComponent) {
      return jsonApiError(
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
      passwordHash,
      photoUrl: payload.photoUrl,
      photoProvided: payload.photoProvided,
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

    return NextResponse.json(
      {
        message: 'Componente cadastrado com sucesso.',
        item: serializeComponent({
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

    return jsonApiError('Nao foi possivel cadastrar o componente.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
