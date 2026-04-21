import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { getTrimmedQueryParam } from '../../../../lib/api/request.js';
import { serializeComponentPhoto } from '../../../../lib/components/photo.js';
import { serializeUnavailableDates } from '../../../../lib/components/unavailability.js';
import { getMongoCollections } from '../../../../lib/db/mongodb.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toGroupedResponse(groupId, components) {
  const groupedByDate = new Map();

  for (const component of components) {
    const unavailableDates = serializeUnavailableDates(component, { futureOnly: true });

    if (!unavailableDates.length) {
      continue;
    }

    const componentItem = {
      componentId: component._id.toString(),
      fullName: typeof component.fullName === 'string' ? component.fullName : '',
      photoUrl: serializeComponentPhoto(component)
    };

    for (const date of unavailableDates) {
      const existing = groupedByDate.get(date);

      if (existing) {
        existing.push(componentItem);
      } else {
        groupedByDate.set(date, [componentItem]);
      }
    }
  }

  const items = Array.from(groupedByDate.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, dateComponents]) => {
      const componentsSorted = [...dateComponents].sort((left, right) => {
        const byName = left.fullName.localeCompare(right.fullName);
        return byName !== 0 ? byName : left.componentId.localeCompare(right.componentId);
      });

      return {
        date,
        count: componentsSorted.length,
        components: componentsSorted
      };
    });

  const totalEntries = items.reduce((accumulator, item) => accumulator + item.count, 0);

  return {
    groupId,
    count: items.length,
    totalEntries,
    items
  };
}

export async function GET(request) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel', 'group-app'])
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const { components } = await getMongoCollections();

    const documents = await components
      .find({
        groupId,
        isActive: { $ne: false },
        unavailableDates: { $exists: true, $ne: [] }
      })
      .project({ _id: 1, fullName: 1, unavailableDates: 1, photo: 1, photoUrl: 1 })
      .toArray();

    return NextResponse.json(toGroupedResponse(groupId, documents));
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError(
      'Nao foi possivel carregar as indisponibilidades agrupadas dos componentes.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
}
