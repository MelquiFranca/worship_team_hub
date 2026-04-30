import { NextResponse } from 'next/server';
import { isAuthError, toAuthErrorResponse } from '../../../../lib/auth/index.js';
import { requireApiAccessSession, resolveRequestGroupId } from '../../../../lib/api/auth.js';
import { jsonApiError } from '../../../../lib/api/errors.js';
import { getTrimmedQueryParam, readJsonBody } from '../../../../lib/api/request.js';
import { isPlainObject, normalizeIsoDate, normalizeString } from '../../../../lib/api/validation.js';
import { getMongoCollections } from '../../../../lib/db/mongodb.js';
import { parseScaleImageAttachmentInput } from '../../../../lib/scales/imageAttachment.js';
import { getUnavailableComponentsForDateByCategory } from '../../../../lib/scales/componentAvailability.js';
import {
  normalizeCategoryTagIdsInput,
  normalizeSingleCategoryTagId,
  resolveCategoryTagIdsFromSettingsDocument
} from '../../../../lib/categories/tags.js';
import {
  normalizePermissionComponentIds,
  normalizePlaylist,
  normalizeScaleComponents,
  serializeScale
} from '../route.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const SCALE_READ_ALLOWED_AUDIENCES = new Set(['admin-panel', 'group-app', 'component-app']);
const SCALE_PATCH_ALLOWED_AUDIENCES = new Set(['admin-panel', 'group-app', 'component-app']);
const COMPONENT_APP_ALLOWED_PATCH_FIELDS = new Set(['playlist', 'imageAttachment']);
const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;

async function getScaleIdFromParams(params) {
  const resolvedParams = await params;

  if (!resolvedParams || typeof resolvedParams !== 'object') {
    return '';
  }

  return normalizeString(resolvedParams.scaleId);
}

function buildScalePatchPayload(body, allowedCategoryTagIds) {
  const updates = {};

  if (Object.hasOwn(body, 'date')) {
    const date = normalizeIsoDate(body.date);

    if (!date) {
      return { error: 'Informe date no formato YYYY-MM-DD.' };
    }

    updates.date = date;
  }

  if (Object.hasOwn(body, 'shift')) {
    const shift = normalizeString(body.shift);

    if (!shift) {
      return { error: 'Informe shift valido para continuar.' };
    }

    updates.shift = shift;
  }

  if (Object.hasOwn(body, 'components')) {
    const components = normalizeScaleComponents(body.components);

    if (!components) {
      return { error: 'Informe components validos para continuar.' };
    }

    updates.components = components;
  }

  if (Object.hasOwn(body, 'playlist')) {
    const playlist = normalizePlaylist(body.playlist);

    if (playlist === null) {
      return { error: 'Informe playlist valida para continuar.' };
    }

    updates.playlist = playlist;
  }

  if (Object.hasOwn(body, 'playlistEditorComponentIds')) {
    const playlistEditorComponentIds = normalizePermissionComponentIds(body.playlistEditorComponentIds);

    if (playlistEditorComponentIds === null) {
      return { error: 'Informe playlistEditorComponentIds validos para continuar.' };
    }

    updates.playlistEditorComponentIds = playlistEditorComponentIds;
  }

  if (Object.hasOwn(body, 'imageEditorComponentIds')) {
    const imageEditorComponentIds = normalizePermissionComponentIds(body.imageEditorComponentIds);

    if (imageEditorComponentIds === null) {
      return { error: 'Informe imageEditorComponentIds validos para continuar.' };
    }

    updates.imageEditorComponentIds = imageEditorComponentIds;
  }

  if (Object.hasOwn(body, 'imageAttachment')) {
    updates.imageAttachment = body.imageAttachment;
  }

  if (Object.hasOwn(body, 'categoryTagId')) {
    const categoryTagId = normalizeSingleCategoryTagId(body.categoryTagId, { allowedCategoryTagIds });

    if (!categoryTagId) {
      return { error: 'Informe categoryTagId valido para continuar.' };
    }

    updates.categoryTagId = categoryTagId;
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Informe ao menos um campo valido para atualizacao.' };
  }

  return { updates };
}

async function resolveGroupCategoryTagIds(groupSettingsCollection, groupId) {
  const settings = await groupSettingsCollection.findOne({ groupId }, { projection: { categoryTags: 1 } });
  return resolveCategoryTagIdsFromSettingsDocument(settings);
}

function normalizeComparableText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function getUsernameCandidates(user) {
  const candidates = new Set();

  if (typeof user?.username === 'string' && user.username.trim()) {
    const normalizedUsername = user.username.trim().toLowerCase();
    candidates.add(normalizedUsername);

    if (normalizedUsername.includes('@')) {
      const localPart = normalizedUsername.split('@')[0];
      if (localPart) {
        candidates.add(localPart);
      }
    }
  }

  if (typeof user?.email === 'string' && user.email.trim()) {
    const email = user.email.trim().toLowerCase();
    candidates.add(email);
    const emailLocalPart = email.split('@')[0];
    if (emailLocalPart) {
      candidates.add(emailLocalPart);
    }
  }

  return candidates;
}

function getNameCandidates(user) {
  const candidates = new Set();

  if (typeof user?.name === 'string' && user.name.trim()) {
    candidates.add(normalizeComparableText(user.name));
  }

  return candidates;
}

async function resolveSessionComponentId(componentsCollection, groupId, scaleComponents, user) {
  const componentIds = (Array.isArray(scaleComponents) ? scaleComponents : [])
    .map((item) => normalizeString(item?.componentId))
    .filter(Boolean);

  if (!componentIds.length) {
    return '';
  }

  const components = await componentsCollection
    .find({ groupId, _id: { $in: componentIds } })
    .project({ _id: 1, username: 1, fullName: 1 })
    .toArray();

  if (!components.length) {
    return '';
  }

  const usernameCandidates = getUsernameCandidates(user);
  const nameCandidates = getNameCandidates(user);

  if (!usernameCandidates.size && !nameCandidates.size) {
    return '';
  }

  const byUsername = components.find((component) =>
    usernameCandidates.has(normalizeString(component?.username).toLowerCase())
  );

  if (byUsername) {
    return byUsername._id;
  }

  const byName = components.find((component) =>
    nameCandidates.has(normalizeComparableText(component?.fullName))
  );

  if (byName) {
    return byName._id;
  }

  return '';
}

async function doesComponentExistInGroup(componentsCollection, groupId, componentId) {
  if (!componentId) {
    return false;
  }

  const component = await componentsCollection.findOne(
    { groupId, _id: componentId },
    { projection: { _id: 1 } }
  );

  return Boolean(component?._id);
}

async function validateGroupComponentIds(componentsCollection, groupId, componentIds) {
  if (!Array.isArray(componentIds) || componentIds.length === 0) {
    return true;
  }

  const existingComponents = await componentsCollection
    .find({ groupId, _id: { $in: componentIds } })
    .project({ _id: 1 })
    .toArray();

  return existingComponents.length === componentIds.length;
}

export async function GET(request, { params }) {
  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: SCALE_READ_ALLOWED_AUDIENCES
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const scaleId = await getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { scales, components, groupSettings } = await getMongoCollections();
    const groupCategoryTagIds = await resolveGroupCategoryTagIds(groupSettings, groupId);
    const defaultCategoryTagId = groupCategoryTagIds[0] || 'louvor';
    await scales.updateMany(
      {
        groupId,
        $or: [
          { categoryTagId: { $exists: false } },
          { categoryTagId: '' },
          { categoryTagId: null }
        ]
      },
      { $set: { categoryTagId: defaultCategoryTagId } }
    );
    const scale = await scales.findOne({ _id: scaleId, groupId });

    if (!scale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    if (session.claims.aud === 'group-app' || session.claims.aud === 'component-app') {
      const sessionComponent = await components.findOne(
        { _id: session.user.id, groupId, isActive: { $ne: false } },
        { projection: { categoryTagIds: 1 } }
      );
      const sessionCategoryTagIds =
        normalizeCategoryTagIdsInput(sessionComponent?.categoryTagIds, {
          allowedCategoryTagIds: groupCategoryTagIds
        }) || [];

      if (!sessionCategoryTagIds.includes(scale.categoryTagId || defaultCategoryTagId)) {
        return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
      }
    }

    return NextResponse.json({ item: serializeScale(scale) });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request, { params }) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de edicao de escala e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: SCALE_PATCH_ALLOWED_AUDIENCES
    });
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, {
      bodyGroupId: typeof body.groupId === 'string' ? body.groupId : '',
      queryGroupId
    });
    const scaleId = await getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { scales, components, groupSettings } = await getMongoCollections();
    const groupCategoryTagIds = await resolveGroupCategoryTagIds(groupSettings, groupId);
    const parsed = buildScalePatchPayload(body, groupCategoryTagIds);

    if (parsed.error) {
      return jsonApiError(parsed.error, 400, 'BAD_REQUEST');
    }

    const existingScale = await scales.findOne({ _id: scaleId, groupId });

    if (!existingScale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    if (Object.hasOwn(body, 'imageAttachment')) {
      const defaultSourceScaleLabel = `${existingScale.date || ''} - ${existingScale.shift || ''}`.trim();
      const imageAttachmentInput = parseScaleImageAttachmentInput(body, {
        allowRemoval: true,
        defaultSourceScaleId: scaleId,
        defaultSourceScaleLabel
      });

      if (imageAttachmentInput.error) {
        return jsonApiError(imageAttachmentInput.error, 400, 'BAD_REQUEST');
      }

      parsed.updates.imageAttachment = imageAttachmentInput.removeImageAttachment
        ? null
        : imageAttachmentInput.imageAttachment;
    }

    if (session.claims.aud === 'component-app') {
      const requestedFields = Object.keys(parsed.updates);
      const hasInvalidField = requestedFields.some((field) => !COMPONENT_APP_ALLOWED_PATCH_FIELDS.has(field));

      if (hasInvalidField) {
        return jsonApiError(
          'Seu perfil nao possui permissao para atualizar estes campos da escala.',
          403,
          'FORBIDDEN'
        );
      }

      const sessionComponentId = await resolveSessionComponentId(
        components,
        groupId,
        existingScale.components,
        session.user
      );
      const playlistEditors = Array.isArray(existingScale.playlistEditorComponentIds)
        ? existingScale.playlistEditorComponentIds
        : [];
      const imageEditors = Array.isArray(existingScale.imageEditorComponentIds)
        ? existingScale.imageEditorComponentIds
        : [];
      const isUpdatingPlaylist = requestedFields.includes('playlist');
      const isUpdatingImageAttachment = requestedFields.includes('imageAttachment');
      let imagePermissionComponentId = sessionComponentId;

      if (isUpdatingImageAttachment) {
        const sessionUserId = normalizeString(session?.user?.id);
        const sessionUserIdBelongsToGroup = await doesComponentExistInGroup(
          components,
          groupId,
          sessionUserId
        );
        imagePermissionComponentId = sessionUserIdBelongsToGroup ? sessionUserId : sessionComponentId;
      }

      if (isUpdatingPlaylist && (!sessionComponentId || !playlistEditors.includes(sessionComponentId))) {
        return jsonApiError(
          'Seu perfil nao possui permissao para editar a playlist desta escala.',
          403,
          'FORBIDDEN'
        );
      }

      if (
        isUpdatingImageAttachment &&
        (!imagePermissionComponentId || !imageEditors.includes(imagePermissionComponentId))
      ) {
        return jsonApiError(
          'Seu perfil nao possui permissao para editar a imagem desta escala.',
          403,
          'FORBIDDEN'
        );
      }
    }

    if (Object.hasOwn(parsed.updates, 'components')) {
      const componentIds = parsed.updates.components.map((item) => item.componentId);
      const existingComponents = await components
        .find({ groupId, _id: { $in: componentIds.map((componentId) => componentId) } })
        .project({ _id: 1, categoryTagIds: 1, unavailableDates: 1, unavailabilityByDate: 1, fullName: 1, username: 1 })
        .toArray();

      if (existingComponents.length !== componentIds.length) {
        return jsonApiError(
          'Um ou mais componentId informados nao pertencem ao grupo ou nao existem.',
          400,
          'BAD_REQUEST'
        );
      }
    }

    const nextComponentIds = new Set(
      (parsed.updates.components || existingScale.components || []).map((item) => item.componentId)
    );
    const currentPlaylistEditorComponentIds = Array.isArray(parsed.updates.playlistEditorComponentIds)
      ? parsed.updates.playlistEditorComponentIds
      : Array.isArray(existingScale.playlistEditorComponentIds)
        ? existingScale.playlistEditorComponentIds
        : [];
    const currentImageEditorComponentIds = Array.isArray(parsed.updates.imageEditorComponentIds)
      ? parsed.updates.imageEditorComponentIds
      : Array.isArray(existingScale.imageEditorComponentIds)
        ? existingScale.imageEditorComponentIds
        : [];

    const normalizedPlaylistEditorComponentIds = currentPlaylistEditorComponentIds.filter((componentId) =>
      nextComponentIds.has(componentId)
    );
    const normalizedImageEditorComponentIds = currentImageEditorComponentIds;

    if (normalizedPlaylistEditorComponentIds.length !== currentPlaylistEditorComponentIds.length) {
      return jsonApiError(
        'As permissoes de playlist precisam apontar para componentes selecionados na escala.',
        400,
        'BAD_REQUEST'
      );
    }

    if (!(await validateGroupComponentIds(components, groupId, normalizedImageEditorComponentIds))) {
      return jsonApiError(
        'Um ou mais IDs de imageEditorComponentIds nao pertencem ao grupo ou nao existem.',
        400,
        'BAD_REQUEST'
      );
    }

    const nextDate = parsed.updates.date || existingScale.date;
    const nextShift = parsed.updates.shift || existingScale.shift;
    const nextCategoryTagId = Object.hasOwn(parsed.updates, 'categoryTagId')
      ? parsed.updates.categoryTagId
      : normalizeSingleCategoryTagId(existingScale.categoryTagId, { allowedCategoryTagIds: groupCategoryTagIds }) ||
        groupCategoryTagIds[0] ||
        'louvor';
    const isDateOrShiftChanging = nextDate !== existingScale.date || nextShift !== existingScale.shift;

    if (
      Object.hasOwn(parsed.updates, 'components') ||
      Object.hasOwn(parsed.updates, 'date') ||
      Object.hasOwn(parsed.updates, 'categoryTagId')
    ) {
      const nextScaleComponents = parsed.updates.components || existingScale.components || [];
      const nextComponentIds = nextScaleComponents
        .map((item) => normalizeString(item?.componentId))
        .filter(Boolean);

      if (nextComponentIds.length > 0) {
        const componentsForAvailability = await components
          .find({ groupId, _id: { $in: nextComponentIds } })
          .project({ _id: 1, fullName: 1, username: 1, unavailableDates: 1, unavailabilityByDate: 1, categoryTagIds: 1 })
          .toArray();

        const allComponentsMatchCategory = componentsForAvailability.every((component) => {
          const categoryTagIds =
            normalizeCategoryTagIdsInput(component?.categoryTagIds, {
              allowedCategoryTagIds: groupCategoryTagIds
            }) || groupCategoryTagIds;
          return categoryTagIds.includes(nextCategoryTagId);
        });

        if (!allComponentsMatchCategory) {
          return jsonApiError(
            'Todos os componentes selecionados devem estar vinculados a categoria da escala.',
            400,
            'BAD_REQUEST'
          );
        }

        const unavailableComponents = getUnavailableComponentsForDateByCategory(
          componentsForAvailability,
          nextDate,
          nextCategoryTagId
        );

        if (unavailableComponents.length > 0) {
          const componentNames = unavailableComponents.map((component) => component.name).join(', ');
          return jsonApiError(
            `Nao e possivel escalar componentes indisponiveis na data ${nextDate}: ${componentNames}.`,
            400,
            'BAD_REQUEST'
          );
        }
      }
    }

    if (isDateOrShiftChanging) {
      const duplicateScale = await scales.findOne({
        _id: { $ne: scaleId },
        groupId,
        date: nextDate,
        shift: nextShift,
        categoryTagId: nextCategoryTagId
      });

      if (duplicateScale) {
        return jsonApiError('Ja existe uma escala com esta data e turno neste grupo.', 409, 'CONFLICT');
      }
    }

    const now = new Date().toISOString();
    const nextMetadata = {
      ...(isPlainObject(existingScale.metadata) ? existingScale.metadata : {}),
      updatedByUserId: session.user.id,
      updatedByAudience: session.claims.aud,
      source: 'api'
    };

    const updatePayload = {
      ...parsed.updates,
      playlistEditorComponentIds: normalizedPlaylistEditorComponentIds,
      imageEditorComponentIds: normalizedImageEditorComponentIds,
      updatedAt: now,
      metadata: nextMetadata
    };

    await scales.updateOne(
      { _id: scaleId, groupId },
      { $set: updatePayload }
    );

    const updatedScale = await scales.findOne({ _id: scaleId, groupId });

    if (!updatedScale) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({
      message: 'Escala atualizada com sucesso.',
      item: serializeScale(updatedScale)
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.code === 11000) {
      return jsonApiError('Ja existe uma escala com esta data e turno neste grupo.', 409, 'CONFLICT');
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel atualizar a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await requireApiAccessSession(request);
    const queryGroupId = getTrimmedQueryParam(request, 'groupId');
    const groupId = resolveRequestGroupId(session.claims, { queryGroupId });
    const scaleId = await getScaleIdFromParams(params);

    if (!scaleId) {
      return jsonApiError('Informe scaleId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { scales } = await getMongoCollections();
    const result = await scales.deleteOne({ _id: scaleId, groupId });

    if (!result.deletedCount) {
      return jsonApiError('Escala nao encontrada para este grupo.', 404, 'NOT_FOUND');
    }

    return NextResponse.json({ message: 'Escala excluida com sucesso.' });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel excluir a escala.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
