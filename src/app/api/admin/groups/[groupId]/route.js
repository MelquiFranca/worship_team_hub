import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { createPasswordHash, isAuthError, toAuthErrorResponse } from '@/lib/auth';
import { requireApiAccessSession } from '@/lib/api/auth';
import { jsonApiError } from '@/lib/api/errors';
import { isPlainObject, normalizeString } from '@/lib/api/validation';
import { readJsonBody } from '@/lib/api/request';
import { getMongoCollections } from '@/lib/db/mongodb';
import {
  buildGroupSettingsDocument,
  getDefaultGroupSettings,
  normalizeGroupInput,
  normalizeManagerInput,
  normalizeSettingsInput,
  resolveUniqueGroupSlug,
  serializeGroupSettings,
  serializeManager
} from '@/lib/admin/groupAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getGroupIdFromParams(params) {
  return normalizeString(params?.groupId);
}

function isPromiseLike(value) {
  return Boolean(value && typeof value === 'object' && typeof value.then === 'function');
}

async function resolveRouteParams(params) {
  if (isPromiseLike(params)) {
    return params;
  }

  return params || {};
}

function buildGroupIdFilter(groupId) {
  if (!groupId) {
    return { _id: '' };
  }

  if (ObjectId.isValid(groupId)) {
    return {
      $or: [
        { _id: groupId },
        { _id: new ObjectId(groupId) }
      ]
    };
  }

  return { _id: groupId };
}

function serializeGroup(document) {
  return {
    id: String(document._id),
    slug: typeof document.slug === 'string' ? document.slug : '',
    name: typeof document.name === 'string' ? document.name : 'Grupo sem nome',
    status: document.status === 'inactive' ? 'inactive' : 'active',
    photoUrl: typeof document.photoUrl === 'string' ? document.photoUrl : '',
    createdAt: typeof document.createdAt === 'string' ? document.createdAt : '',
    updatedAt: typeof document.updatedAt === 'string' ? document.updatedAt : ''
  };
}

async function findManagerComponent(components, groupId, managerId = '') {
  if (managerId) {
    const byId = await components.findOne({ _id: managerId, groupId, permissionType: 'group-app' });

    if (byId) {
      return byId;
    }
  }

  return components
    .find({ groupId, permissionType: 'group-app' })
    .sort({ createdAt: 1 })
    .limit(1)
    .next();
}

export async function GET(request, { params }) {
  try {
    await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel'])
    });

    const resolvedParams = await resolveRouteParams(params);
    const groupId = getGroupIdFromParams(resolvedParams);

    if (!groupId) {
      return jsonApiError('Informe groupId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { db, groupSettings, components } = await getMongoCollections();
    const groupsCollection = db.collection('groups');
    const group = await groupsCollection.findOne(buildGroupIdFilter(groupId));

    if (!group) {
      return jsonApiError('Grupo nao encontrado.', 404, 'NOT_FOUND');
    }

    const settings = await groupSettings.findOne({ groupId });
    const manager = await findManagerComponent(components, groupId);

    return NextResponse.json({
      item: {
        group: serializeGroup(group),
        settings: settings
          ? serializeGroupSettings(settings, groupId)
          : getDefaultGroupSettings(group?.name),
        manager: serializeManager(manager)
      }
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel carregar os dados do grupo.', 500, 'INTERNAL_SERVER_ERROR');
  }
}

export async function PATCH(request, { params }) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de edicao de grupo e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel'])
    });

    const resolvedParams = await resolveRouteParams(params);
    const groupId = getGroupIdFromParams(resolvedParams);

    if (!groupId) {
      return jsonApiError('Informe groupId valido para continuar.', 400, 'BAD_REQUEST');
    }

    const { db, groupSettings, components } = await getMongoCollections();
    const groupsCollection = db.collection('groups');
    const groupFilter = buildGroupIdFilter(groupId);
    const existingGroup = await groupsCollection.findOne(groupFilter);

    if (!existingGroup) {
      return jsonApiError('Grupo nao encontrado.', 404, 'NOT_FOUND');
    }

    const groupInput = normalizeGroupInput({
      name: body.name ?? existingGroup.name,
      status: body.status ?? existingGroup.status
    });

    if (groupInput.error) {
      return jsonApiError(groupInput.error, 400, 'BAD_REQUEST');
    }

    const existingSettings = await groupSettings.findOne({ groupId });
    const fallbackSettings = {
      name: existingSettings?.name || groupInput.name,
      themeName: existingSettings?.themeName,
      functionOptions: existingSettings?.functionOptions,
      availableFunctions: existingSettings?.availableFunctions,
      photoUrl: existingSettings?.photoUrl,
      photoProvided: existingSettings?.photoProvided
    };

    const settingsInput = normalizeSettingsInput(body.settings || fallbackSettings, groupInput.name);

    if (settingsInput.error) {
      return jsonApiError(settingsInput.error, 400, 'BAD_REQUEST');
    }

    const existingManager = await findManagerComponent(
      components,
      groupId,
      normalizeString(body?.manager?.id)
    );

    const managerInput = normalizeManagerInput(
      {
        ...(body.manager || {}),
        id: body?.manager?.id || existingManager?._id || '',
        fullName: body?.manager?.fullName || existingManager?.fullName || '',
        birthDate: body?.manager?.birthDate || existingManager?.birthDate || '',
        username: body?.manager?.username || existingManager?.username || '',
        password: body?.manager?.password || ''
      },
      { requirePassword: !existingManager }
    );

    if (managerInput.error) {
      return jsonApiError(managerInput.error, 400, 'BAD_REQUEST');
    }

    const duplicateUsername = await components.findOne({
      _id: { $ne: existingManager?._id || '' },
      normalizedUsername: managerInput.value.normalizedUsername
    });

    if (duplicateUsername) {
      return jsonApiError('Ja existe um usuario gestor com esse username neste grupo.', 409, 'CONFLICT');
    }

    const now = new Date().toISOString();
    const nextSlug = await resolveUniqueGroupSlug(groupsCollection, groupInput.name, groupId);

    await groupsCollection.updateOne(
      { _id: existingGroup._id },
      {
        $set: {
          name: groupInput.name,
          slug: nextSlug,
          status: groupInput.status,
          updatedAt: now,
          metadata: {
            ...(existingGroup?.metadata && typeof existingGroup.metadata === 'object' ? existingGroup.metadata : {}),
            updatedByUserId: session.user.id,
            updatedByAudience: session.claims.aud,
            source: 'api-admin'
          }
        }
      }
    );

    const settingsDoc = buildGroupSettingsDocument(
      settingsInput.value,
      groupId,
      existingSettings,
      session,
      now
    );

    const settingsUpdateDoc = Object.keys(settingsDoc.unset).length
      ? { $set: settingsDoc.set, $unset: settingsDoc.unset }
      : { $set: settingsDoc.set };

    await groupSettings.updateOne({ groupId }, settingsUpdateDoc, { upsert: true });

    const managerSet = {
      fullName: managerInput.value.fullName,
      birthDate: managerInput.value.birthDate,
      username: managerInput.value.username,
      normalizedUsername: managerInput.value.normalizedUsername,
      permissionType: 'group-app',
      isActive: true,
      updatedAt: now,
      metadata: {
        ...(existingManager?.metadata && typeof existingManager.metadata === 'object' ? existingManager.metadata : {}),
        updatedByUserId: session.user.id,
        updatedByAudience: session.claims.aud,
        source: 'api-admin'
      }
    };

    if (managerInput.value.password.trim()) {
      managerSet.passwordHash = createPasswordHash(managerInput.value.password);
    }

    if (existingManager) {
      await components.updateOne({ _id: existingManager._id, groupId }, { $set: managerSet });
    } else {
      await components.insertOne({
        _id: crypto.randomUUID(),
        groupId,
        ...managerSet,
        passwordHash: managerSet.passwordHash,
        photoUrl: '',
        photoProvided: false,
        pushTargets: [],
        pushSubscriptions: [],
        createdAt: now,
        metadata: {
          ...managerSet.metadata,
          createdByUserId: session.user.id,
          createdByAudience: session.claims.aud
        }
      });
    }

    const updatedGroup = await groupsCollection.findOne({ _id: existingGroup._id });
    const updatedSettings = await groupSettings.findOne({ groupId });
    const updatedManager = await findManagerComponent(components, groupId, managerInput.value.id);

    return NextResponse.json({
      message: 'Grupo atualizado com sucesso.',
      item: {
        group: serializeGroup(updatedGroup || existingGroup),
        settings: updatedSettings
          ? serializeGroupSettings(updatedSettings, groupId)
          : getDefaultGroupSettings(groupInput.name),
        manager: serializeManager(updatedManager)
      }
    });
  } catch (error) {
    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (error?.code === 11000) {
      return jsonApiError('Ja existe um grupo ou usuario com os dados informados.', 409, 'CONFLICT');
    }

    if (error?.message === 'MongoDB indisponivel.' || error?.message === 'MongoDB nao configurado.') {
      return jsonApiError('Servico de persistencia indisponivel no momento.', 500, 'INTERNAL_SERVER_ERROR');
    }

    return jsonApiError('Nao foi possivel atualizar o grupo.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
