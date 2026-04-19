import crypto from 'node:crypto';
import { GROUP_FUNCTION_OPTIONS } from '@/data/groupFunctions';
import { GROUP_THEME_FALLBACK, resolveGroupTheme } from '@/theme/groupTheme';
import { normalizeIsoDate, normalizeLowercaseString, normalizeString } from '@/lib/api/validation';
import { parseComponentPhotoInput, serializeComponentPhoto } from '@/lib/components/photo';

const BASE_FUNCTION_OPTIONS = GROUP_FUNCTION_OPTIONS.map((option) => ({
  id: option.id,
  label: option.label,
  hint: normalizeString(option.hint) || 'Funcao do grupo',
  isCustom: false
}));

const DEFAULT_GROUP_SETTINGS = Object.freeze({
  name: 'Equipe principal',
  functionOptions: BASE_FUNCTION_OPTIONS,
  availableFunctions: ['vocal', 'guitarra', 'teclado'],
  themeName: GROUP_THEME_FALLBACK
});

const DEFAULT_GROUP_STATUS = 'active';
const ALLOWED_GROUP_STATUS = new Set(['active', 'inactive']);

function toSlugSeed(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toFunctionIdSeed(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeFunctionOptions(value) {
  const source = Array.isArray(value) ? value : DEFAULT_GROUP_SETTINGS.functionOptions;
  const items = [];
  const seenIds = new Set();

  source.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const label = normalizeString(item.label);
    const hint = normalizeString(item.hint) || 'Funcao personalizada';
    const rawId = normalizeString(item.id);
    const id = rawId || toFunctionIdSeed(label);

    if (!id || !label || seenIds.has(id)) {
      return;
    }

    seenIds.add(id);
    items.push({
      id,
      label,
      hint,
      isCustom: Boolean(item.isCustom)
    });
  });

  if (!items.length) {
    return DEFAULT_GROUP_SETTINGS.functionOptions;
  }

  return items;
}

export function normalizeAvailableFunctions(value, functionOptions = DEFAULT_GROUP_SETTINGS.functionOptions) {
  const validIds = new Set(functionOptions.map((option) => option.id));
  const source = Array.isArray(value) ? value : DEFAULT_GROUP_SETTINGS.availableFunctions;
  const selected = [];

  source.forEach((item) => {
    const functionId = normalizeString(item);

    if (!functionId || !validIds.has(functionId) || selected.includes(functionId)) {
      return;
    }

    selected.push(functionId);
  });

  if (!selected.length && functionOptions.length > 0) {
    selected.push(functionOptions[0].id);
  }

  return selected;
}

export function normalizeThemeName(value) {
  return resolveGroupTheme(value).name;
}

export function normalizeGroupStatus(value) {
  const normalized = normalizeString(value).toLowerCase();
  return ALLOWED_GROUP_STATUS.has(normalized) ? normalized : DEFAULT_GROUP_STATUS;
}

export function normalizeGroupName(value) {
  return normalizeString(value);
}

export function serializeGroupSettings(document, groupId) {
  const functionOptions = normalizeFunctionOptions(document?.functionOptions);
  const availableFunctions = normalizeAvailableFunctions(document?.availableFunctions, functionOptions);

  return {
    id: document?._id ? String(document._id) : '',
    groupId: normalizeString(document?.groupId) || groupId,
    name: normalizeGroupName(document?.name) || DEFAULT_GROUP_SETTINGS.name,
    photo: serializeComponentPhoto(document),
    photoUrl: normalizeString(document?.photoUrl),
    photoProvided: Boolean(document?.photoProvided),
    functionOptions,
    availableFunctions,
    themeName: normalizeThemeName(document?.themeName),
    createdAt: normalizeString(document?.createdAt),
    updatedAt: normalizeString(document?.updatedAt)
  };
}

export function normalizeGroupInput(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Dados de grupo invalidos.' };
  }

  const name = normalizeGroupName(body.name);
  const status = normalizeGroupStatus(body.status);

  if (name.length < 3 || name.length > 80) {
    return { error: 'O nome do grupo deve ter entre 3 e 80 caracteres.' };
  }

  return { name, status };
}

export function normalizeSettingsInput(rawSettings, fallbackName) {
  const settings = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const functionOptions = normalizeFunctionOptions(settings.functionOptions);

  if (!functionOptions.length) {
    return { error: 'Cadastre ao menos um tipo de funcao.' };
  }

  const availableFunctions = normalizeAvailableFunctions(settings.availableFunctions, functionOptions);

  if (!availableFunctions.length) {
    return { error: 'Selecione ao menos uma funcao.' };
  }

  const normalizedName = normalizeGroupName(settings.name) || fallbackName;

  if (normalizedName.length < 3 || normalizedName.length > 48) {
    return { error: 'O nome das configuracoes do grupo deve ter entre 3 e 48 caracteres.' };
  }

  const photoInput = parseComponentPhotoInput(settings, { allowRemoval: true });

  if (photoInput.error) {
    return { error: photoInput.error };
  }

  return {
    value: {
      name: normalizedName,
      functionOptions,
      availableFunctions,
      themeName: normalizeThemeName(settings.themeName),
      photoInput
    }
  };
}

export function normalizeManagerInput(rawManager, { requirePassword = false } = {}) {
  if (!rawManager || typeof rawManager !== 'object') {
    return { error: 'Dados do usuario gestor invalidos.' };
  }

  const id = normalizeString(rawManager.id);
  const fullName = normalizeString(rawManager.fullName);
  const birthDate = normalizeIsoDate(rawManager.birthDate);
  const username = normalizeString(rawManager.username);
  const normalizedUsername = normalizeLowercaseString(username);
  const password = typeof rawManager.password === 'string' ? rawManager.password : '';

  if (!fullName) {
    return { error: 'Informe o nome completo do usuario gestor.' };
  }

  if (!birthDate) {
    return { error: 'Informe a data de nascimento do usuario gestor no formato YYYY-MM-DD.' };
  }

  if (!username) {
    return { error: 'Informe o username do usuario gestor.' };
  }

  if (requirePassword && !password.trim()) {
    return { error: 'Informe a senha inicial do usuario gestor.' };
  }

  return {
    value: {
      id,
      fullName,
      birthDate,
      username,
      normalizedUsername,
      password
    }
  };
}

export function buildGroupSettingsDocument(settingsValue, groupId, existingDocument, session, now) {
  const existingMetadata =
    existingDocument && typeof existingDocument.metadata === 'object' && existingDocument.metadata
      ? existingDocument.metadata
      : {};

  const nextSet = {
    groupId,
    name: settingsValue.name,
    functionOptions: settingsValue.functionOptions,
    availableFunctions: settingsValue.availableFunctions,
    themeName: settingsValue.themeName,
    updatedAt: now,
    metadata: {
      ...existingMetadata,
      updatedByUserId: session.user.id,
      updatedByAudience: session.claims.aud,
      source: 'api-admin'
    }
  };

  const unset = {};

  if (settingsValue.photoInput?.removePhoto) {
    unset.photo = '';
    nextSet.photoUrl = '';
    nextSet.photoProvided = false;
  }

  if (settingsValue.photoInput?.photo) {
    nextSet.photo = settingsValue.photoInput.photo;
    nextSet.photoProvided = true;
  }

  if (settingsValue.photoInput?.photoUrl !== undefined) {
    nextSet.photoUrl = settingsValue.photoInput.photoUrl;
  }

  if (
    settingsValue.photoInput?.photoProvided !== undefined &&
    !settingsValue.photoInput.removePhoto &&
    !settingsValue.photoInput.photo
  ) {
    nextSet.photoProvided = settingsValue.photoInput.photoProvided;
  }

  if (!existingDocument) {
    nextSet._id = crypto.randomUUID();
    nextSet.createdAt = now;
    nextSet.metadata = {
      ...nextSet.metadata,
      createdByUserId: session.user.id,
      createdByAudience: session.claims.aud
    };
  }

  return {
    set: nextSet,
    unset
  };
}

export async function resolveUniqueGroupSlug(groupsCollection, name, excludeGroupId = '') {
  const base = toSlugSeed(name) || 'grupo';
  let suffix = 0;

  while (suffix < 300) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const existing = await groupsCollection.findOne({
      slug: candidate,
      ...(excludeGroupId ? { _id: { $ne: excludeGroupId } } : {})
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

export function serializeManager(document) {
  if (!document) {
    return null;
  }

  return {
    id: String(document._id),
    fullName: normalizeString(document.fullName),
    birthDate: normalizeString(document.birthDate),
    username: normalizeString(document.username),
    permissionType: 'group-app',
    isActive: typeof document.isActive === 'boolean' ? document.isActive : true,
    createdAt: normalizeString(document.createdAt),
    updatedAt: normalizeString(document.updatedAt)
  };
}

export function getDefaultGroupSettings(name = '') {
  return {
    ...DEFAULT_GROUP_SETTINGS,
    name: normalizeGroupName(name) || DEFAULT_GROUP_SETTINGS.name,
    photo: '',
    photoUrl: '',
    photoProvided: false,
    functionOptions: normalizeFunctionOptions(DEFAULT_GROUP_SETTINGS.functionOptions),
    availableFunctions: normalizeAvailableFunctions(DEFAULT_GROUP_SETTINGS.availableFunctions)
  };
}

export function getDefaultGroupStatus() {
  return DEFAULT_GROUP_STATUS;
}
