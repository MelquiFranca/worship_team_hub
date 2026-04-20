import { normalizeIsoDate, normalizeString } from '../api/validation.js';

function normalizeUnavailableDates(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeIsoDate(entry))
    .filter(Boolean);
}

export function getUnavailableComponentsForDate(components = [], scaleDate) {
  const normalizedDate = normalizeIsoDate(scaleDate);

  if (!normalizedDate || !Array.isArray(components) || components.length === 0) {
    return [];
  }

  return components
    .filter((component) => {
      const unavailableDates = normalizeUnavailableDates(component?.unavailableDates);
      return unavailableDates.includes(normalizedDate);
    })
    .map((component) => ({
      id: normalizeString(component?._id || component?.id || component?.componentId),
      name: normalizeString(component?.fullName || component?.name || component?.username) || 'Componente',
      date: normalizedDate
    }))
    .filter((component) => component.id);
}
