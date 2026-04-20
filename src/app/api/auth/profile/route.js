import { NextResponse } from 'next/server';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import {
  getCurrentAuthProfile,
  readProfilePatchBody,
  requireProfileAccessSession,
  updateCurrentAuthProfile
} from '../../../../lib/auth/profile.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await requireProfileAccessSession(request);
    const item = await getCurrentAuthProfile(session);

    return NextResponse.json({ item });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar o perfil do usuario.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request) {
  const body = await readProfilePatchBody(request);

  if (!body || typeof body !== 'object') {
    return jsonApiError('A requisicao de atualizacao de perfil e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireProfileAccessSession(request);
    const result = await updateCurrentAuthProfile(session, body);

    if (result.error) {
      return jsonApiError(result.error, result.status || 400, result.code || 'BAD_REQUEST');
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso.',
      item: result.item
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel atualizar o perfil do usuario.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
