import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createPasswordHash, isAuthError, toAuthErrorResponse } from '@/lib/auth';
import { requireApiAccessSession } from '@/lib/api/auth';
import { jsonApiError } from '@/lib/api/errors';
import { isPlainObject } from '@/lib/api/validation';
import { readJsonBody } from '@/lib/api/request';
import { getMongoCollections } from '@/lib/db/mongodb';
import {
  buildGroupSettingsDocument,
  getDefaultGroupSettings,
  getDefaultGroupStatus,
  normalizeGroupInput,
  normalizeManagerInput,
  normalizeSettingsInput,
  resolveUniqueGroupSlug,
  serializeGroupSettings,
  serializeManager
} from '@/lib/admin/groupAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(request) {
  const body = await readJsonBody(request);

  if (!isPlainObject(body)) {
    return jsonApiError('A requisicao de cadastro de grupo e invalida.', 400, 'BAD_REQUEST');
  }

  try {
    const session = await requireApiAccessSession(request, {
      allowedAudiences: new Set(['admin-panel'])
    });

    const groupInput = normalizeGroupInput(body);

    if (groupInput.error) {
      return jsonApiError(groupInput.error, 400, 'BAD_REQUEST');
    }

    const settingsInput = normalizeSettingsInput(body.settings, groupInput.name);

    if (settingsInput.error) {
      return jsonApiError(settingsInput.error, 400, 'BAD_REQUEST');
    }

    const managerInput = normalizeManagerInput(body.manager, { requirePassword: true });

    if (managerInput.error) {
      return jsonApiError(managerInput.error, 400, 'BAD_REQUEST');
    }

    const { db, groupSettings, components } = await getMongoCollections();
    const groupsCollection = db.collection('groups');

    const duplicateUsername = await components.findOne({
      groupId: { $exists: true },
      normalizedUsername: managerInput.value.normalizedUsername
    });

    if (duplicateUsername) {
      return jsonApiError('Ja existe um usuario gestor com esse username.', 409, 'CONFLICT');
    }

    const now = new Date().toISOString();
    const groupId = crypto.randomUUID();
    const slug = await resolveUniqueGroupSlug(groupsCollection, groupInput.name);

    const groupDocument = {
      _id: groupId,
      slug,
      name: groupInput.name,
      status: groupInput.status || getDefaultGroupStatus(),
      photoUrl: '',
      createdAt: now,
      updatedAt: now,
      metadata: {
        createdByUserId: session.user.id,
        createdByAudience: session.claims.aud,
        updatedByUserId: session.user.id,
        updatedByAudience: session.claims.aud,
        source: 'api-admin'
      }
    };

    await groupsCollection.insertOne(groupDocument);

    try {
      const settingsDoc = buildGroupSettingsDocument(settingsInput.value, groupId, null, session, now);
      await groupSettings.insertOne(settingsDoc.set);

      const managerDocument = {
        _id: crypto.randomUUID(),
        groupId,
        fullName: managerInput.value.fullName,
        birthDate: managerInput.value.birthDate,
        username: managerInput.value.username,
        normalizedUsername: managerInput.value.normalizedUsername,
        permissionType: 'group-app',
        isActive: true,
        passwordHash: createPasswordHash(managerInput.value.password),
        photoUrl: '',
        photoProvided: false,
        pushTargets: [],
        pushSubscriptions: [],
        createdAt: now,
        updatedAt: now,
        metadata: {
          createdByUserId: session.user.id,
          createdByAudience: session.claims.aud,
          updatedByUserId: session.user.id,
          updatedByAudience: session.claims.aud,
          source: 'api-admin'
        }
      };

      await components.insertOne(managerDocument);

      const storedSettings = await groupSettings.findOne({ groupId });

      return NextResponse.json(
        {
          message: 'Grupo cadastrado com sucesso.',
          item: {
            group: serializeGroup(groupDocument),
            settings: storedSettings
              ? serializeGroupSettings(storedSettings, groupId)
              : getDefaultGroupSettings(groupInput.name),
            manager: serializeManager(managerDocument)
          }
        },
        { status: 201 }
      );
    } catch (innerError) {
      await Promise.all([
        groupsCollection.deleteOne({ _id: groupId }),
        groupSettings.deleteOne({ groupId }),
        components.deleteMany({ groupId, permissionType: 'group-app' })
      ]);

      throw innerError;
    }
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

    return jsonApiError('Nao foi possivel cadastrar o grupo.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
