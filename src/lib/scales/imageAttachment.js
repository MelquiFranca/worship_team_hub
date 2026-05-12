import { isPlainObject, normalizeString } from '../api/validation.js';

export const SCALE_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_SCALE_IMAGE_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const SCALE_IMAGE_CONTENT_TYPE_ALIASES = new Map([
  ['image/jpg', 'image/jpeg']
]);

function normalizeImageContentType(value) {
  const normalized = normalizeString(value).toLowerCase();
  return SCALE_IMAGE_CONTENT_TYPE_ALIASES.get(normalized) || normalized;
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

function isHttpUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
}

function parsePhotoDataUrl(value, filename, now) {
  const trimmedValue = normalizeString(value);

  if (!trimmedValue || !trimmedValue.startsWith('data:')) {
    return { error: 'Informe imageAttachment.src como data URL base64 valida.' };
  }

  const commaIndex = trimmedValue.indexOf(',');

  if (commaIndex < 0) {
    return { error: 'Informe imageAttachment.src como data URL base64 valida.' };
  }

  const header = trimmedValue.slice(5, commaIndex).trim();
  const payload = trimmedValue.slice(commaIndex + 1).trim();

  if (!header || !payload) {
    return { error: 'Informe imageAttachment.src como data URL base64 valida.' };
  }

  const headerParts = header
    .split(';')
    .map((part) => normalizeString(part))
    .filter(Boolean);

  const contentType = normalizeImageContentType(headerParts.shift());
  const hasBase64Flag = headerParts.some((part) => part.toLowerCase() === 'base64');

  if (!contentType || !ALLOWED_SCALE_IMAGE_CONTENT_TYPES.has(contentType)) {
    return { error: 'Informe imageAttachment.src com tipo de imagem valido.' };
  }

  if (!hasBase64Flag) {
    return { error: 'Informe imageAttachment.src como data URL base64 valida.' };
  }

  const normalizedBase64 = payload.replace(/\s+/g, '');

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64)) {
    return { error: 'Informe imageAttachment.src como data URL base64 valida.' };
  }

  const data = Buffer.from(normalizedBase64, 'base64');

  if (!data.length) {
    return { error: 'Informe imageAttachment.src com imagem valida.' };
  }

  if (data.length > SCALE_IMAGE_MAX_BYTES) {
    return { error: 'A imagem da escala excede o limite de 8 MB.' };
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

function toSafeIdSeed(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function createFallbackImageId(...seeds) {
  const seed = seeds.map((value) => toSafeIdSeed(value)).find(Boolean);
  return seed ? `scale-image-${seed}` : `scale-image-${Date.now()}`;
}

export function parseScaleImageAttachmentInput(
  body,
  {
    allowRemoval = false,
    now = new Date().toISOString(),
    defaultSourceScaleId = '',
    defaultSourceScaleLabel = ''
  } = {}
) {
  if (!isPlainObject(body)) {
    return { error: 'A requisicao de imagem da escala e invalida.' };
  }

  if (!Object.hasOwn(body, 'imageAttachment')) {
    return {
      imageAttachment: undefined,
      removeImageAttachment: false
    };
  }

  const rawAttachment = body.imageAttachment;

  if (rawAttachment === null) {
    if (!allowRemoval) {
      return { error: 'Informe imageAttachment valido para continuar.' };
    }

    return {
      imageAttachment: null,
      removeImageAttachment: true
    };
  }

  if (!isPlainObject(rawAttachment)) {
    return { error: 'Informe imageAttachment valido para continuar.' };
  }

  const id = normalizeString(rawAttachment.id);
  const label = normalizeString(rawAttachment.label);
  const alt = normalizeString(rawAttachment.alt);
  const sourceScaleId = normalizeString(rawAttachment.sourceScaleId) || normalizeString(defaultSourceScaleId);
  const sourceScaleLabel =
    normalizeString(rawAttachment.sourceScaleLabel) || normalizeString(defaultSourceScaleLabel);
  const filename = normalizeString(rawAttachment.filename);

  const src = normalizeString(rawAttachment.src);
  const imageUrl = normalizeString(rawAttachment.imageUrl);
  const photoDataUrl = normalizeString(rawAttachment.photoDataUrl);
  const imageSource = src || photoDataUrl || imageUrl;

  if (!imageSource) {
    return { error: 'Informe imageAttachment.src para continuar.' };
  }

  const imageAttachment = {
    id: id || createFallbackImageId(sourceScaleId, imageSource.slice(0, 64)),
    alt: alt || label || 'Imagem da escala',
    label: label || 'Imagem da escala',
    sourceScaleId: sourceScaleId || undefined,
    sourceScaleLabel: sourceScaleLabel || undefined,
    updatedAt: now
  };

  if (Object.hasOwn(rawAttachment, 'isLocalUpload')) {
    imageAttachment.isLocalUpload = Boolean(rawAttachment.isLocalUpload);
  }

  if (imageSource.startsWith('data:')) {
    const parsed = parsePhotoDataUrl(imageSource, filename, now);

    if (parsed.error) {
      return parsed;
    }

    imageAttachment.photo = parsed.photo;
  } else if (isHttpUrl(imageSource)) {
    imageAttachment.imageUrl = imageSource;
  } else {
    return { error: 'Informe imageAttachment.src com URL valida ou data URL base64.' };
  }

  return {
    imageAttachment,
    removeImageAttachment: false
  };
}

export function serializeScaleImageAttachment(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const photo = isPlainObject(value.photo) ? value.photo : null;
  const contentType = normalizeImageContentType(photo?.contentType);
  const data = toBuffer(photo?.data);
  const imageUrl = normalizeString(value.imageUrl);
  const src =
    contentType && ALLOWED_SCALE_IMAGE_CONTENT_TYPES.has(contentType) && data?.length
      ? `data:${contentType};base64,${data.toString('base64')}`
      : imageUrl;

  if (!src) {
    return null;
  }

  return {
    id: normalizeString(value.id) || createFallbackImageId(value.sourceScaleId, src.slice(0, 64)),
    src,
    alt: normalizeString(value.alt) || 'Imagem da escala',
    label: normalizeString(value.label) || 'Imagem da escala',
    sourceScaleId: normalizeString(value.sourceScaleId) || '',
    sourceScaleLabel: normalizeString(value.sourceScaleLabel) || '',
    isLocalUpload: Boolean(value.isLocalUpload),
    updatedAt: normalizeString(value.updatedAt) || ''
  };
}
