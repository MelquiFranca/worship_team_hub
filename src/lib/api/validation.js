export function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeLowercaseString(value) {
  return normalizeString(value).toLowerCase();
}

export function normalizeIsoDate(value) {
  const rawDate = normalizeString(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return '';
  }

  const [yearString, monthString, dayString] = rawDate.split('-');
  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);
  const day = Number.parseInt(dayString, 10);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(utcDate.getTime()) ||
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return '';
  }

  return rawDate;
}
