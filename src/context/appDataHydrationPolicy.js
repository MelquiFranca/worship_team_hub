function normalizeAudience(audience) {
  return typeof audience === 'string' ? audience.trim() : '';
}

export function canHydrateGroupedComponentUnavailability(audience) {
  const normalizedAudience = normalizeAudience(audience);
  return normalizedAudience === 'admin-panel' || normalizedAudience === 'group-app';
}
