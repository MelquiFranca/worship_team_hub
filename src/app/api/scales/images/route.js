import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { getTrimmedQueryParam, parseLimitParam } from '../../../../lib/api/request.js';
import { normalizeString } from '../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../lib/db/mongodb.js';
import { serializeScaleImageAttachment } from '../../../../lib/scales/imageAttachment.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildScaleImageSourceLabel(scale) {
  const date = normalizeString(scale?.date);
  const shift = normalizeString(scale?.shift);

  if (!date && !shift) {
    return '';
  }

  if (!date) {
    return shift;
  }

  if (!shift) {
    return date;
  }

  return `${date} - ${shift}`;
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

    const { scales } = await getMongoCollections();
    const query = scales
      .find({ groupId, imageAttachment: { $exists: true, $ne: null } })
      .project({
        _id: 1,
        date: 1,
        shift: 1,
        imageAttachment: 1,
        updatedAt: 1
      })
      .sort({ updatedAt: -1, createdAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    const documents = await query.toArray();
    const seen = new Set();
    const items = [];

    documents.forEach((document) => {
      const imageAttachment = serializeScaleImageAttachment(document.imageAttachment);

      if (!imageAttachment) {
        return;
      }

      const uniqueKey = imageAttachment.id || imageAttachment.src;

      if (!uniqueKey || seen.has(uniqueKey)) {
        return;
      }

      seen.add(uniqueKey);
      items.push({
        ...imageAttachment,
        sourceScaleId: imageAttachment.sourceScaleId || document._id.toString(),
        sourceScaleLabel: imageAttachment.sourceScaleLabel || buildScaleImageSourceLabel(document)
      });
    });

    return NextResponse.json({ items, count: items.length, groupId });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel listar as imagens das escalas.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
