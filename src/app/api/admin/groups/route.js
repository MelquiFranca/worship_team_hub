import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createPasswordHash, isAuthError, toAuthErrorResponse } from '@/lib/auth';
import { requireApiAccessSession } from '@/lib/api/auth';
import { jsonApiError } from '@/lib/api/errors';
import { isPlainObject } from '@/lib/api/validation';
import { readJsonBody } from '@/lib/api/request';
import { getMongoCollections } from '@/lib/db/mongodb';
import {
  isMongoMultiCollectionTransactionsEnabled,
  isMongoTransactionFallbackEnabled,
  MongoTransactionUnsupportedError,
  runMongoTransactionWithRetry
} from '@/lib/db/transactions';
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

function buildManagerDocument(groupId, managerInput, session, now) {
  return {
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

    const { client, db, groupSettings, components } = await getMongoCollections();
    const groupsCollection = db.collection('groups');

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

    const writeGroupWithCompensation = async () => {
      const duplicateUsername = await components.findOne({
        groupId: { $exists: true },
        normalizedUsername: managerInput.value.normalizedUsername
      });

      if (duplicateUsername) {
        return { conflict: true };
      }

      await groupsCollection.insertOne(groupDocument);

      try {
        const settingsDoc = buildGroupSettingsDocument(settingsInput.value, groupId, null, session, now);
        await groupSettings.insertOne(settingsDoc.set);

        const managerDocument = buildManagerDocument(groupId, managerInput, session, now);

        await components.insertOne(managerDocument);

        const storedSettings = await groupSettings.findOne({ groupId });

        return {
          conflict: false,
          storedSettings,
          managerDocument
        };
      } catch (innerError) {
        await Promise.all([
          groupsCollection.deleteOne({ _id: groupId }),
          groupSettings.deleteOne({ groupId }),
          components.deleteMany({ groupId, permissionType: 'group-app' })
        ]);

        throw innerError;
      }

    };

    const writeGroupWithTransaction = async () => {
      let storedSettings = null;
      let managerDocument = null;

      await runMongoTransactionWithRetry({
        client,
        name: 'admin_groups_create',
        operation: async (mongoSession) => {
          const duplicateUsername = await components.findOne(
            {
              groupId: { $exists: true },
              normalizedUsername: managerInput.value.normalizedUsername
            },
            { session: mongoSession }
          );

          if (duplicateUsername) {
            const conflictError = new Error('manager_username_conflict');
            conflictError.code = 'MANAGER_USERNAME_CONFLICT';
            throw conflictError;
          }

          await groupsCollection.insertOne(groupDocument, { session: mongoSession });

          const settingsDoc = buildGroupSettingsDocument(settingsInput.value, groupId, null, session, now);
          await groupSettings.insertOne(settingsDoc.set, { session: mongoSession });

          managerDocument = buildManagerDocument(groupId, managerInput, session, now);
          await components.insertOne(managerDocument, { session: mongoSession });

          storedSettings = await groupSettings.findOne({ groupId }, { session: mongoSession });
        }
      });

      return {
        conflict: false,
        storedSettings,
        managerDocument
      };
    };

    let writeResult;
    const txEnabled = isMongoMultiCollectionTransactionsEnabled();

    if (txEnabled) {
      try {
        writeResult = await writeGroupWithTransaction();
      } catch (error) {
        if (error?.code === 'MANAGER_USERNAME_CONFLICT') {
          return jsonApiError('Ja existe um usuario gestor com esse username.', 409, 'CONFLICT');
        }

        if (error instanceof MongoTransactionUnsupportedError && isMongoTransactionFallbackEnabled()) {
          console.warn('transaction_fallback_compensation', {
            name: 'admin_groups_create',
            reason: 'environment_not_supported'
          });
          writeResult = await writeGroupWithCompensation();
        } else {
          throw error;
        }
      }
    } else {
      writeResult = await writeGroupWithCompensation();
    }

    if (writeResult.conflict) {
      return jsonApiError('Ja existe um usuario gestor com esse username.', 409, 'CONFLICT');
    }

    return NextResponse.json(
      {
        message: 'Grupo cadastrado com sucesso.',
        item: {
          group: serializeGroup(groupDocument),
          settings: writeResult.storedSettings
            ? serializeGroupSettings(writeResult.storedSettings, groupId)
            : getDefaultGroupSettings(groupInput.name),
          manager: serializeManager(writeResult.managerDocument)
        }
      },
      { status: 201 }
    );
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

    if (error instanceof MongoTransactionUnsupportedError) {
      return jsonApiError(
        'Transacoes MongoDB indisponiveis no ambiente atual. Ative replica set ou habilite fallback.',
        503,
        'TRANSACTION_UNAVAILABLE'
      );
    }

    return jsonApiError('Nao foi possivel cadastrar o grupo.', 500, 'INTERNAL_SERVER_ERROR');
  }
}
