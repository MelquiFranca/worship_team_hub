import { normalizeString } from '../api/validation.js';

export const DEFAULT_GROUP_CATEGORY_TAGS = Object.freeze([
  { id: 'louvor', label: 'Louvor', color: '#1dd8bc' },
  { id: 'midia', label: 'Midia', color: '#b45309' }
]);

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function normalizeTagId(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeColor(value) {
  const normalized = normalizeString(value).toLowerCase();
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : '';
}

function cloneDefaultTags() {
  return DEFAULT_GROUP_CATEGORY_TAGS.map((tag) => ({ ...tag }));
}

export function normalizeCategoryTagsInput(value) {
  const source = Array.isArray(value) ? value : DEFAULT_GROUP_CATEGORY_TAGS;
  const seenIds = new Set();
  const normalized = [];

  source.forEach((entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const label = normalizeString(entry.label);
    const rawId = normalizeString(entry.id);
    const id = normalizeTagId(rawId || label);
    const color = normalizeColor(entry.color);

    if (!id || !label || !color || seenIds.has(id)) {
      return;
    }

    seenIds.add(id);
    normalized.push({
      id,
      label,
      color
    });
  });

  return normalized.length ? normalized : cloneDefaultTags();
}

export function resolveCategoryTagsFromSettingsDocument(settingsDocument) {
  return normalizeCategoryTagsInput(settingsDocument?.categoryTags);
}

export function resolveCategoryTagIdsFromSettingsDocument(settingsDocument) {
  return resolveCategoryTagsFromSettingsDocument(settingsDocument).map((tag) => tag.id);
}

export function normalizeCategoryTagIdsInput(value, options = {}) {
  if (!Array.isArray(value)) {
    return null;
  }

  const allowedCategoryTagIds = Array.isArray(options.allowedCategoryTagIds) && options.allowedCategoryTagIds.length > 0
    ? new Set(options.allowedCategoryTagIds)
    : null;
  const normalized = [];
  const seenIds = new Set();

  for (const entry of value) {
    const id = normalizeTagId(entry);

    if (!id || seenIds.has(id)) {
      continue;
    }

    if (allowedCategoryTagIds && !allowedCategoryTagIds.has(id)) {
      return null;
    }

    seenIds.add(id);
    normalized.push(id);
  }

  return normalized.length ? normalized : null;
}

export function normalizeSingleCategoryTagId(value, options = {}) {
  const id = normalizeTagId(value);

  if (!id) {
    return '';
  }

  if (Array.isArray(options.allowedCategoryTagIds) && options.allowedCategoryTagIds.length > 0) {
    if (!options.allowedCategoryTagIds.includes(id)) {
      return '';
    }
  }

  return id;
}

export function resolveTagColorById(categoryTags, categoryTagId) {
  if (!Array.isArray(categoryTags)) {
    return '';
  }

  const normalizedId = normalizeTagId(categoryTagId);
  const match = categoryTags.find((tag) => tag?.id === normalizedId);
  return match?.color || '';
}

export function resolveTagLabelById(categoryTags, categoryTagId) {
  if (!Array.isArray(categoryTags)) {
    return '';
  }

  const normalizedId = normalizeTagId(categoryTagId);
  const match = categoryTags.find((tag) => tag?.id === normalizedId);
  return match?.label || '';
}
