import crypto from 'node:crypto';

const CLOUDINARY_URL_PROTOCOL = 'cloudinary:';
const CLOUDINARY_CLOUD_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_UPLOAD_ERROR_DETAIL_LENGTH = 180;
const SENSITIVE_UPLOAD_ERROR_VALUE_PATTERN = /\b(api[_\s-]?(?:secret|key)|signature|token|authorization|password)\b\s*([:=])\s*([^\s,;]+)/gi;

export class MediaStorageError extends Error {
  constructor(message, code = 'MEDIA_STORAGE_ERROR') {
    super(message);
    this.name = 'MediaStorageError';
    this.code = code;
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeUploadErrorDetail(value) {
  const detail = normalizeString(value).replace(/\s+/g, ' ');

  if (!detail) {
    return '';
  }

  return detail
    .replace(SENSITIVE_UPLOAD_ERROR_VALUE_PATTERN, (_match, key, separator) => `${key}${separator}[redacted]`)
    .slice(0, MAX_UPLOAD_ERROR_DETAIL_LENGTH);
}

async function getUploadFailureDetail(response) {
  const headerDetail = sanitizeUploadErrorDetail(response?.headers?.get?.('x-cld-error'));

  if (headerDetail) {
    return headerDetail;
  }

  const contentType = normalizeString(response?.headers?.get?.('content-type')).toLowerCase();

  if (!contentType.includes('application/json')) {
    return '';
  }

  try {
    const payload = await response.json();
    return sanitizeUploadErrorDetail(payload?.error?.message || payload?.message);
  } catch {
    return '';
  }
}

async function createUploadFailureError(response) {
  const status = Number.isInteger(response?.status) ? `HTTP ${response.status}` : '';
  const detail = await getUploadFailureDetail(response);
  const context = [status, detail].filter(Boolean).join(': ');
  const suffix = context ? ` (${context})` : '';

  return new MediaStorageError(`O CDN recusou o upload da imagem${suffix}.`, 'MEDIA_STORAGE_UPLOAD_FAILED');
}

function parseCloudinaryUrl(value) {
  const connectionUrl = normalizeString(value);

  if (!connectionUrl) {
    throw new MediaStorageError(
      'O armazenamento de imagens nao esta configurado. Defina CLOUDINARY_URL.',
      'MEDIA_STORAGE_NOT_CONFIGURED'
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(connectionUrl);
  } catch {
    throw new MediaStorageError('CLOUDINARY_URL possui formato invalido.', 'MEDIA_STORAGE_INVALID_CONFIG');
  }

  const cloudName = normalizeString(parsedUrl.hostname);
  const apiKey = normalizeString(decodeURIComponent(parsedUrl.username));
  const apiSecret = normalizeString(decodeURIComponent(parsedUrl.password));

  if (
    parsedUrl.protocol !== CLOUDINARY_URL_PROTOCOL ||
    !cloudName ||
    !CLOUDINARY_CLOUD_NAME_PATTERN.test(cloudName) ||
    !apiKey ||
    !apiSecret
  ) {
    throw new MediaStorageError('CLOUDINARY_URL possui formato invalido.', 'MEDIA_STORAGE_INVALID_CONFIG');
  }

  return { cloudName, apiKey, apiSecret };
}

function createSignature(parameters, apiSecret) {
  const payload = Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
}

function normalizeUploadResponse(payload) {
  const url = normalizeString(payload?.secure_url) || normalizeString(payload?.url);
  const publicId = normalizeString(payload?.public_id);

  if (!url || !publicId) {
    throw new MediaStorageError('O CDN retornou uma resposta de upload invalida.', 'MEDIA_STORAGE_UPLOAD_FAILED');
  }

  return {
    url,
    storage: {
      provider: 'cloudinary',
      publicId,
      resourceType: 'image'
    }
  };
}

export function createCloudinaryMediaStorage({ cloudinaryUrl, fetchImpl = fetch } = {}) {
  const config = parseCloudinaryUrl(cloudinaryUrl);

  return {
    provider: 'cloudinary',

    async uploadImage({ data, contentType, publicId, folder = 'escalas-app' }) {
      if (!Buffer.isBuffer(data) || !data.length || !normalizeString(contentType) || !normalizeString(publicId)) {
        throw new MediaStorageError('Imagem invalida para upload no CDN.', 'MEDIA_STORAGE_INVALID_INPUT');
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const parameters = { folder, overwrite: 'true', public_id: publicId, timestamp };
      const form = new FormData();
      form.set('file', `data:${contentType};base64,${data.toString('base64')}`);
      Object.entries(parameters).forEach(([key, value]) => form.set(key, String(value)));
      form.set('api_key', config.apiKey);
      form.set('signature', createSignature(parameters, config.apiSecret));

      let response;
      try {
        response = await fetchImpl(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
          method: 'POST',
          body: form
        });
      } catch {
        throw new MediaStorageError('Nao foi possivel conectar ao CDN para enviar a imagem.', 'MEDIA_STORAGE_UNAVAILABLE');
      }

      if (!response.ok) {
        throw await createUploadFailureError(response);
      }

      try {
        return normalizeUploadResponse(await response.json());
      } catch (error) {
        if (error instanceof MediaStorageError) {
          throw error;
        }

        throw new MediaStorageError('O CDN retornou uma resposta de upload invalida.', 'MEDIA_STORAGE_UPLOAD_FAILED');
      }
    },

    async deleteImage(storage) {
      const publicId = normalizeString(storage?.publicId);

      if (!publicId || normalizeString(storage?.provider) !== 'cloudinary') {
        return false;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const parameters = { invalidate: 'true', public_id: publicId, timestamp };
      const form = new FormData();
      Object.entries(parameters).forEach(([key, value]) => form.set(key, String(value)));
      form.set('api_key', config.apiKey);
      form.set('signature', createSignature(parameters, config.apiSecret));

      try {
        const response = await fetchImpl(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, {
          method: 'POST',
          body: form
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  };
}

/**
 * Resolve a porta de armazenamento. Novos provedores devem implementar
 * `uploadImage` e `deleteImage` e ser registrados somente neste ponto.
 */
export function getMediaStorage({ env = process.env, fetchImpl = fetch } = {}) {
  const provider = normalizeString(env?.MEDIA_STORAGE_PROVIDER || 'cloudinary').toLowerCase();

  if (provider !== 'cloudinary') {
    throw new MediaStorageError(
      `O provider de armazenamento \"${provider || 'desconhecido'}\" nao e suportado.`,
      'MEDIA_STORAGE_PROVIDER_UNSUPPORTED'
    );
  }

  return createCloudinaryMediaStorage({ cloudinaryUrl: env?.CLOUDINARY_URL, fetchImpl });
}

export async function deleteStoredImage(storage, options) {
  if (!storage || typeof storage !== 'object') {
    return false;
  }

  try {
    const mediaStorage = getMediaStorage(options);
    return await mediaStorage.deleteImage(storage);
  } catch {
    return false;
  }
}
