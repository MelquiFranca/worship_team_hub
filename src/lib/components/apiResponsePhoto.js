import { isPlainObject, normalizeString } from '../api/validation.js';
import { serializeComponentPhoto } from './photo.js';

const DISABLED_FLAG_VALUES = new Set(['0', 'false', 'off', 'no', 'disabled']);

function hasStoredComponentPhotoBinary(document) {
  if (!isPlainObject(document?.photo)) {
    return false;
  }

  const photo = document.photo;

  if (typeof photo.data === 'string' && normalizeString(photo.data)) {
    return true;
  }

  if (photo.data && typeof photo.data === 'object') {
    return true;
  }

  if (photo.buffer && typeof photo.buffer === 'object') {
    return true;
  }

  return false;
}

export function isComponentImagesInApiResponsesEnabled(env = process.env) {
  const raw = normalizeString(env?.COMPONENT_IMAGES_RESPONSE_ENABLED);

  if (!raw) {
    return true;
  }

  return !DISABLED_FLAG_VALUES.has(raw.toLowerCase());
}

export function hasStoredComponentPhoto(document) {
  return Boolean(
    document?.photoProvided ||
    normalizeString(document?.photoUrl) ||
    hasStoredComponentPhotoBinary(document)
  );
}

export function serializeComponentPhotoFieldsForApi(document, { env = process.env } = {}) {
  if (!isComponentImagesInApiResponsesEnabled(env)) {
    return {
      photoUrl: '',
      photoDataUrl: '',
      photoProvided: hasStoredComponentPhoto(document)
    };
  }

  const photoDataUrl = serializeComponentPhoto(document);

  return {
    photoUrl: normalizeString(document?.photoUrl),
    photoDataUrl,
    photoProvided: Boolean(document?.photoProvided || photoDataUrl)
  };
}

export function serializeComponentPhotoValueForApi(document, { env = process.env } = {}) {
  if (!isComponentImagesInApiResponsesEnabled(env)) {
    return '';
  }

  return serializeComponentPhoto(document);
}

export function getComponentPhotoMongoProjection({ env = process.env } = {}) {
  if (isComponentImagesInApiResponsesEnabled(env)) {
    return {
      photo: 1,
      photoUrl: 1,
      photoProvided: 1
    };
  }

  return {
    photoUrl: 1,
    photoProvided: 1
  };
}
