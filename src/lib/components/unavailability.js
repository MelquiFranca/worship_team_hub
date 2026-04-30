import { normalizeIsoDate } from '../api/validation.js';
import { normalizeCategoryTagIdsInput } from '../categories/tags.js';

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function toIsoToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function isFutureIsoDate(value, options = {}) {
  const date = normalizeIsoDate(value);

  if (!date) {
    return false;
  }

  const todayIso = normalizeIsoDate(options.todayIsoDate) || toIsoToday();
  return date > todayIso;
}

export function normalizeUnavailableDatesInput(value, options = {}) {
  const { futureOnly = false, todayIsoDate } = options;
  if (!Array.isArray(value)) {
    return null;
  }

  const normalizedDates = [];
  const referenceToday = normalizeIsoDate(todayIsoDate) || toIsoToday();

  for (const entry of value) {
    const date = normalizeIsoDate(entry);

    if (!date) {
      return null;
    }

    if (futureOnly && date <= referenceToday) {
      return null;
    }

    normalizedDates.push(date);
  }

  return uniqueSorted(normalizedDates);
}

export function normalizeUnavailabilityByDateInput(value, options = {}) {
  const { futureOnly = false, todayIsoDate, allowedCategoryTagIds = [] } = options;

  if (!Array.isArray(value)) {
    return null;
  }

  const referenceToday = normalizeIsoDate(todayIsoDate) || toIsoToday();
  const byDate = new Map();

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const date = normalizeIsoDate(entry.date);

    if (!date) {
      return null;
    }

    if (futureOnly && date <= referenceToday) {
      return null;
    }

    const categoryTagIds = normalizeCategoryTagIdsInput(entry.categoryTagIds, {
      allowedCategoryTagIds
    });

    if (!categoryTagIds || categoryTagIds.length === 0) {
      return null;
    }

    const current = byDate.get(date) || [];
    byDate.set(date, uniqueSorted([...current, ...categoryTagIds]));
  }

  return Array.from(byDate.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, categoryTagIds]) => ({ date, categoryTagIds }));
}

export function serializeUnavailableDates(document, options = {}) {
  const { futureOnly = false, todayIsoDate } = options;
  const source = document?.unavailableDates;

  if (!Array.isArray(source)) {
    return [];
  }

  const referenceToday = normalizeIsoDate(todayIsoDate) || toIsoToday();

  const normalizedDates = source
    .map((entry) => normalizeIsoDate(entry))
    .filter(Boolean)
    .filter((date) => (!futureOnly ? true : date > referenceToday));

  return uniqueSorted(normalizedDates);
}

export function serializeUnavailabilityByDate(document, options = {}) {
  const {
    futureOnly = false,
    todayIsoDate,
    allowedCategoryTagIds = [],
    fallbackCategoryTagIds = []
  } = options;
  const source = document?.unavailabilityByDate;
  const referenceToday = normalizeIsoDate(todayIsoDate) || toIsoToday();

  if (Array.isArray(source)) {
    return source
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const date = normalizeIsoDate(entry.date);
        if (!date || (futureOnly && date <= referenceToday)) {
          return null;
        }

        const categoryTagIds = normalizeCategoryTagIdsInput(entry.categoryTagIds, {
          allowedCategoryTagIds
        });

        if (!categoryTagIds || categoryTagIds.length === 0) {
          return null;
        }

        return { date, categoryTagIds };
      })
      .filter(Boolean)
      .sort((left, right) => left.date.localeCompare(right.date));
  }

  const legacyDates = serializeUnavailableDates(document, { futureOnly, todayIsoDate: referenceToday });
  const normalizedFallbackCategoryTagIds = normalizeCategoryTagIdsInput(fallbackCategoryTagIds, {
    allowedCategoryTagIds
  });

  return legacyDates
    .map((date) => ({
      date,
      categoryTagIds: normalizedFallbackCategoryTagIds || []
    }))
    .filter((entry) => entry.categoryTagIds.length > 0);
}
