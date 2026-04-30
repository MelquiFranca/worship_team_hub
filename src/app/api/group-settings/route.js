import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../lib/api/auth.js';
import { jsonApiError } from '../../../lib/api/errors.js';
import { isPlainObject, normalizeString } from '../../../lib/api/validation.js';
import { getTrimmedQueryParam, readJsonBody } from '../../../lib/api/request.js';
import { isAuthError, toAuthErrorResponse } from '../../../lib/auth/index.js';
import { GROUP_FUNCTION_OPTIONS } from '../../../data/groupFunctions.js';
import { GROUP_THEME_FALLBACK, resolveGroupTheme } from '../../../theme/groupTheme.js';
import { getMongoCollections } from '../../../lib/db/mongodb.js';
import { parseComponentPhotoInput, serializeComponentPhoto } from '../../../lib/components/photo.js';
import {
  DEFAULT_GROUP_CATEGORY_TAGS,
  normalizeCategoryTagsInput,
  normalizeSingleCategoryTagId
} from '../../../lib/categories/tags.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  themeName: GROUP_THEME_FALLBACK,
  categoryTags: DEFAULT_GROUP_CATEGORY_TAGS
});
const FIXED_CATEGORY_TAGS = normalizeCategoryTagsInput(DEFAULT_GROUP_CATEGORY_TAGS);

function normalizeGroupName(value) {
  return normalizeString(value);
}

function normalizeThemeName(value) {
  const resolved = resolveGroupTheme(value);
  return resolved.name;
}

function normalizeFunctionLabel(value) {
  return normalizeString(value);
}

function normalizeFunctionHint(value) {
  return normalizeString(value);
}

function toFunctionIdSeed(value) {
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

function normalizeFunctionOptions(value, allowedCategoryTagIds = DEFAULT_GROUP_CATEGORY_TAGS.map((tag) => tag.id)) {
  const source = Array.isArray(value) ? value : DEFAULT_GROUP_SETTINGS.functionOptions;
  const items = [];
  const seenIds = new Set();

  source.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const label = normalizeFunctionLabel(item.label);
    const hint = normalizeFunctionHint(item.hint) || 'Funcao personalizada';
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
      isCustom: Boolean(item.isCustom),
      categoryTagId: normalizeSingleCategoryTagId(item.categoryTagId, { allowedCategoryTagIds }) || allowedCategoryTagIds[0]
    });
  });

  if (!items.length) {
    return DEFAULT_GROUP_SETTINGS.functionOptions;
  }

  return items;
}

function normalizeAvailableFunctions(value, functionOptions = DEFAULT_GROUP_SETTINGS.functionOptions) {
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

function serializeGroupSettings(document, groupId) {
  const photoDataUrl = serializeComponentPhoto(document);
  const categoryTags = FIXED_CATEGORY_TAGS;
  const categoryTagIds = categoryTags.map((tag) => tag.id);
  const functionOptions = normalizeFunctionOptions(document?.functionOptions, categoryTagIds);
  const availableFunctions = normalizeAvailableFunctions(document?.availableFunctions, functionOptions);

  return {
    id: document?._id ? String(document._id) : '',
    groupId: normalizeString(document?.groupId) || groupId,
    name: normalizeGroupName(document?.name) || DEFAULT_GROUP_SETTINGS.name,
    photo: photoDataUrl,
    photoDataUrl,
    photoUrl: normalizeString(document?.photoUrl),
    photoProvided: Boolean(photoDataUrl),
    functionOptions,
    availableFunctions,
    categoryTags,
    themeName: normalizeThemeName(document?.themeName),
    createdAt: normalizeString(document?.createdAt),
    updatedAt: normalizeString(document?.updatedAt)
  };
}

function buildPatchPayload(body, photoInput) {
  const updates = {};
  const unset = {};

  if (Object.hasOwn(body, 'name')) {
    const name = normalizeGroupName(body.name);

    if (name.length < 3 || name.length > 48) {
      return { error: 'O nome do grupo deve ter entre 3 e 48 caracteres.' };
    }

    updates.name = name;
  }

  const categoryTagsFromBody = Object.hasOwn(body, 'categoryTags') ? normalizeCategoryTagsInput(body.categoryTags) : null;
  const allowedCategoryTagIdsFromBody = FIXED_CATEGORY_TAGS.map((tag) => tag.id);
  let functionOptions = null;

  if (Object.hasOwn(body, 'functionOptions')) {
    functionOptions = normalizeFunctionOptions(body.functionOptions, allowedCategoryTagIdsFromBody);

    if (!functionOptions.length) {
      return { error: 'Cadastre ao menos um tipo de funcao.' };
    }

    updates.functionOptions = functionOptions;
  }

  if (Object.hasOwn(body, 'availableFunctions')) {
    const resolvedFunctionOptions = functionOptions || DEFAULT_GROUP_SETTINGS.functionOptions;
    const availableFunctions = normalizeAvailableFunctions(body.availableFunctions, resolvedFunctionOptions);

    if (!availableFunctions.length) {
      return { error: 'Selecione ao menos uma funcao.' };
    }

    updates.availableFunctions = availableFunctions;
  }

  if (Object.hasOwn(body, 'themeName')) {
    updates.themeName = normalizeThemeName(body.themeName);
  }

  if (Object.hasOwn(body, 'categoryTags')) {
    const asJson = JSON.stringify(categoryTagsFromBody || []);
    const fixedAsJson = JSON.stringify(FIXED_CATEGORY_TAGS);
    if (asJson !== fixedAsJson) {
      return { error: 'As categorias Louvor e Midia sao padrao fixo e nao podem ser alteradas.' };
    }
  }

  if (photoInput?.error) {
    return { error: photoInput.error };
  }

  if (photoInput?.removePhoto) {
    unset.photo = '';
    updates.photoUrl = '';
    updates.photoProvided = false;
  }

  if (photoInput?.photo) {
    updates.photo = photoInput.photo;
    updates.photoProvided = true;
  }

  if (photoInput?.photoUrl !== undefined) {
    updates.photoUrl = photoInput.photoUrl;
  }

  if (photoInput?.photoProvided !== undefined && !photoInput?.removePhoto && !photoInput?.photo) {
    updates.photoProvided = photoInput.photoProvided;
  }

  if (Object.keys(updates).length === 0 && Object.keys(unset).length === 0) {
    return { error: 'Informe ao menos um campo valido para atualizacao.' };
  }

  return { updates, unset };
}

export async function GET(request) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel', 'group-app', 'component-app'])
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const { groupSettings, components, scales } = await getMongoCollections();
    const current = await groupSettings.findOne({ groupId });

    return NextResponse.json({
      item: current
        ? serializeGroupSettings(current, groupId)
        : serializeGroupSettings(
            {
              groupId,
              ...DEFAULT_GROUP_SETTINGS
            },
            groupId
          )
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar as configuracoes do grupo.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de configuracoes do grupo e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel', 'group-app'])
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const photoInput = parseComponentPhotoInput(body, { allowRemoval: true });
    const parsed = buildPatchPayload(body, photoInput);

    if (parsed.error) {
      return jsonApiError(parsed.error, 400, 'BAD_REQUEST');
    }

    const { groupSettings } = await getMongoCollections();
    const existing = await groupSettings.findOne({ groupId });
    const nextCategoryTags = normalizeCategoryTagsInput(parsed.updates.categoryTags || existing?.categoryTags || DEFAULT_GROUP_CATEGORY_TAGS);
    const nextCategoryTagIds = nextCategoryTags.map((tag) => tag.id);
    const existingFunctionOptions = normalizeFunctionOptions(existing?.functionOptions, nextCategoryTagIds);
    const nextFunctionOptions = parsed.updates.functionOptions
      ? normalizeFunctionOptions(parsed.updates.functionOptions, nextCategoryTagIds)
      : existingFunctionOptions;
    parsed.updates.functionOptions = nextFunctionOptions;

    if (!Object.hasOwn(parsed.updates, 'availableFunctions')) {
      parsed.updates.availableFunctions = normalizeAvailableFunctions(existing?.availableFunctions, nextFunctionOptions);
    } else {
      parsed.updates.availableFunctions = normalizeAvailableFunctions(parsed.updates.availableFunctions, nextFunctionOptions);
    }

    parsed.updates.categoryTags = FIXED_CATEGORY_TAGS;

    const now = new Date().toISOString();
    const metadata = {
      ...(isPlainObject(existing?.metadata) ? existing.metadata : {}),
      updatedByUserId: session.user.id,
      updatedByAudience: session.claims.aud,
      source: 'api'
    };

    const nextSet = {
      ...parsed.updates,
      groupId,
      updatedAt: now,
      metadata
    };

    if (!existing) {
      nextSet._id = crypto.randomUUID();
      nextSet.name = nextSet.name || DEFAULT_GROUP_SETTINGS.name;
      nextSet.functionOptions = nextSet.functionOptions || DEFAULT_GROUP_SETTINGS.functionOptions;
      nextSet.availableFunctions = normalizeAvailableFunctions(nextSet.availableFunctions, nextSet.functionOptions);
      nextSet.categoryTags = FIXED_CATEGORY_TAGS;
      nextSet.themeName = nextSet.themeName || DEFAULT_GROUP_SETTINGS.themeName;
      nextSet.createdAt = now;
      nextSet.metadata = {
        ...metadata,
        createdByUserId: session.user.id,
        createdByAudience: session.claims.aud
      };
    }

    const updateDocument = Object.keys(parsed.unset).length
      ? { $set: nextSet, $unset: parsed.unset }
      : { $set: nextSet };

    await groupSettings.updateOne({ groupId }, updateDocument, { upsert: true });

    const updated = await groupSettings.findOne({ groupId });

    if (!updated) {
      return jsonApiError('Nao foi possivel salvar as configuracoes do grupo.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return NextResponse.json({
      message: 'Configuracoes do grupo salvas com sucesso.',
      item: serializeGroupSettings(updated, groupId)
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.code === 11000) {
      return jsonApiError('Ja existe configuracao para este grupo.', 409, 'CONFLICT');
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel salvar as configuracoes do grupo.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
