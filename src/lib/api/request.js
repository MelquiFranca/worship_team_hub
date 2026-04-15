export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function getTrimmedQueryParam(request, name) {
  const { searchParams } = new URL(request.url);
  return searchParams.get(name)?.trim() || '';
}

export function parseLimitParam(request, name = 'limit', max = 100) {
  const rawLimit = getTrimmedQueryParam(request, name);

  if (!rawLimit) {
    return null;
  }

  if (!/^\d+$/.test(rawLimit)) {
    return null;
  }

  const limit = Number.parseInt(rawLimit, 10);

  if (!Number.isInteger(limit) || limit < 1 || limit > max) {
    return null;
  }

  return limit;
}
