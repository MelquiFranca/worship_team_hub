import { normalizeIsoDate } from '../api/validation.js';

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
