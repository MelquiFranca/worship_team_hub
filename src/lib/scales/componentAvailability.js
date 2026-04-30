import { normalizeIsoDate, normalizeString } from '../api/validation.js';
import { normalizeSingleCategoryTagId } from '../categories/tags.js';

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

function normalizeUnavailabilityByDate(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const date = normalizeIsoDate(entry.date);
      const categoryTagIds = Array.isArray(entry.categoryTagIds)
        ? entry.categoryTagIds
          .map((item) => normalizeSingleCategoryTagId(item))
          .filter(Boolean)
        : [];

      if (!date || !categoryTagIds.length) {
        return null;
      }

      return { date, categoryTagIds };
    })
    .filter(Boolean);
}

export function getUnavailableComponentsForDateByCategory(
  components = [],
  scaleDate,
  categoryTagId
) {
  const normalizedDate = normalizeIsoDate(scaleDate);
  const normalizedCategoryTagId = normalizeSingleCategoryTagId(categoryTagId);

  if (!normalizedDate || !normalizedCategoryTagId || !Array.isArray(components) || components.length === 0) {
    return [];
  }

  return components
    .filter((component) => {
      const byDateEntries = normalizeUnavailabilityByDate(component?.unavailabilityByDate);
      return byDateEntries.some(
        (entry) =>
          entry.date === normalizedDate &&
          entry.categoryTagIds.includes(normalizedCategoryTagId)
      );
    })
    .map((component) => ({
      id: normalizeString(component?._id || component?.id || component?.componentId),
      name: normalizeString(component?.fullName || component?.name || component?.username) || 'Componente',
      date: normalizedDate
    }))
    .filter((component) => component.id);
}
