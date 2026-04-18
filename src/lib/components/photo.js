import { isPlainObject, normalizeString } from '../api/validation.js';

export const COMPONENT_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_COMPONENT_PHOTO_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const COMPONENT_PHOTO_CONTENT_TYPE_ALIASES = new Map([
  ['image/jpg', 'image/jpeg']
]);

function normalizePhotoContentType(value) {
  const normalized = normalizeString(value).toLowerCase();
  return COMPONENT_PHOTO_CONTENT_TYPE_ALIASES.get(normalized) || normalized;
}

function toBuffer(value) {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value && typeof value === 'object') {
    if (Buffer.isBuffer(value.buffer)) {
      return value.buffer;
    }

    if (value.buffer instanceof ArrayBuffer) {
      return Buffer.from(value.buffer);
    }

    if (ArrayBuffer.isView(value.buffer)) {
      return Buffer.from(value.buffer.buffer, value.buffer.byteOffset, value.buffer.byteLength);
    }

    if (ArrayBuffer.isView(value.data)) {
      return Buffer.from(value.data.buffer, value.data.byteOffset, value.data.byteLength);
    }

    if (value._bsontype === 'Binary' && value.buffer) {
      return Buffer.from(value.buffer);
    }
  }

  if (typeof value === 'string') {
    try {
      return Buffer.from(value, 'base64');
    } catch {
      return null;
    }
  }

  return null;
}

function parsePhotoDataUrl(value, filename, now) {
  const trimmedValue = normalizeString(value);

  if (!trimmedValue) {
    return { error: 'Informe photoDataUrl valida para continuar.' };
  }

  if (!trimmedValue.startsWith('data:')) {
    return { error: 'Informe photoDataUrl como data URL base64 valida.' };
  }

  const commaIndex = trimmedValue.indexOf(',');

  if (commaIndex < 0) {
    return { error: 'Informe photoDataUrl como data URL base64 valida.' };
  }

  const header = trimmedValue.slice(5, commaIndex).trim();
  const payload = trimmedValue.slice(commaIndex + 1).trim();

  if (!header || !payload) {
    return { error: 'Informe photoDataUrl como data URL base64 valida.' };
  }

  const headerParts = header
    .split(';')
    .map((part) => normalizeString(part))
    .filter(Boolean);

  const contentType = normalizePhotoContentType(headerParts.shift());
  const hasBase64Flag = headerParts.some((part) => part.toLowerCase() === 'base64');

  if (!contentType || !ALLOWED_COMPONENT_PHOTO_CONTENT_TYPES.has(contentType)) {
    return { error: 'Informe photoDataUrl com tipo de imagem valido.' };
  }

  if (!hasBase64Flag) {
    return { error: 'Informe photoDataUrl como data URL base64 valida.' };
  }

  const normalizedBase64 = payload.replace(/\s+/g, '');

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
    return { error: 'Informe photoDataUrl como data URL base64 valida.' };
  }

  const data = Buffer.from(normalizedBase64, 'base64');

  if (!data.length) {
    return { error: 'Informe photoDataUrl com imagem valida.' };
  }

  if (data.length > COMPONENT_PHOTO_MAX_BYTES) {
    return { error: 'A imagem de photoDataUrl excede o limite de 2 MB.' };
  }

  const photo = {
    contentType,
    data,
    size: data.length,
    updatedAt: now
  };

  const normalizedFilename = normalizeString(filename);

  if (normalizedFilename) {
    photo.filename = normalizedFilename;
  }

  return { photo };
}

export function parseComponentPhotoInput(body, { allowRemoval = false, now = new Date().toISOString() } = {}) {
  if (!isPlainObject(body)) {
    return { error: 'A requisicao de foto de componente e invalida.' };
  }

  const hasPhotoDataUrl = Object.hasOwn(body, 'photoDataUrl');
  const hasPhotoUrl = Object.hasOwn(body, 'photoUrl');
  const hasPhotoProvided = Object.hasOwn(body, 'photoProvided');
  const hasPhotoFilename = Object.hasOwn(body, 'photoFilename') || Object.hasOwn(body, 'photoFileName');
  const photoFilename = hasPhotoFilename
    ? (Object.hasOwn(body, 'photoFilename') ? body.photoFilename : body.photoFileName)
    : '';

  let photo;
  let removePhoto = false;
  let photoUrl;
  let photoProvided;

  if (hasPhotoDataUrl) {
    const rawPhotoDataUrl = body.photoDataUrl;

    if (rawPhotoDataUrl === null || rawPhotoDataUrl === '') {
      if (!allowRemoval) {
        return { error: 'Informe photoDataUrl como data URL base64 valida.' };
      }

      removePhoto = true;
      photoProvided = false;
    } else {
      if (typeof rawPhotoDataUrl !== 'string') {
        return { error: 'Informe photoDataUrl como data URL base64 valida.' };
      }

      const parsed = parsePhotoDataUrl(rawPhotoDataUrl, photoFilename, now);

      if (parsed.error) {
        return parsed;
      }

      photo = parsed.photo;
      photoProvided = true;
    }
  }

  if (hasPhotoUrl) {
    photoUrl = normalizeString(body.photoUrl);

    if (!hasPhotoDataUrl && !hasPhotoProvided) {
      photoProvided = Boolean(photoUrl);
    }
  }

  if (!hasPhotoDataUrl && hasPhotoProvided) {
    if (typeof body.photoProvided !== 'boolean') {
      return { error: 'Informe photoProvided como booleano.' };
    }

    photoProvided = body.photoProvided;
  }

  return {
    photo,
    photoUrl,
    photoProvided,
    removePhoto
  };
}

export function serializeComponentPhoto(document) {
  const photo = isPlainObject(document?.photo) ? document.photo : null;
  const contentType = normalizePhotoContentType(photo?.contentType);
  const data = toBuffer(photo?.data);

  if (contentType && ALLOWED_COMPONENT_PHOTO_CONTENT_TYPES.has(contentType) && data?.length) {
    return `data:${contentType};base64,${data.toString('base64')}`;
  }

  return normalizeString(document?.photoUrl);
}
