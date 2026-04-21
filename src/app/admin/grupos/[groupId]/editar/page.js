import AdminGroupForm from '@/components/organisms/AdminGroupForm/AdminGroupForm';
import { ObjectId } from 'mongodb';
import { getMongoCollections } from '@/lib/db/mongodb';
import { serializeComponentPhoto } from '@/lib/components/photo';
import {
  getDefaultGroupSettings,
  serializeGroupSettings,
  serializeManager
} from '@/lib/admin/groupAdmin';

export const metadata = {
  title: 'Editar Grupo Admin | Worship Team Hub',
  description: 'Edicao administrativa de grupo com configuracoes iniciais e gestor group-app.'
};

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
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
    slug: normalizeString(document.slug),
    name: normalizeString(document.name),
    status: normalizeString(document.status) === 'inactive' ? 'inactive' : 'active',
    photoUrl: normalizeString(document.photoUrl),
    createdAt: normalizeString(document.createdAt),
    updatedAt: normalizeString(document.updatedAt)
  };
}

function serializeGroupComponent(document) {
  if (!document || typeof document !== 'object') {
    return null;
  }

  return {
    id: String(document._id || ''),
    fullName: normalizeString(document.fullName) || 'Componente sem nome',
    username: normalizeString(document.username),
    permissionType: normalizeString(document.permissionType) || 'component-app',
    isActive: typeof document.isActive === 'boolean' ? document.isActive : true,
    photo: serializeComponentPhoto(document) || normalizeString(document.photoUrl)
  };
}

async function loadInitialData(groupId) {
  try {
    const { db, groupSettings, components } = await getMongoCollections();
    const groupsCollection = db.collection('groups');
    const group = await groupsCollection.findOne(buildGroupIdFilter(groupId));

    if (!group) {
      return null;
    }

    const settings = await groupSettings.findOne({ groupId });
    const manager = await components
      .find({ groupId, permissionType: 'group-app' })
      .sort({ createdAt: 1 })
      .limit(1)
      .next();
    const groupComponents = (await components
      .find({ groupId })
      .sort({ fullName: 1, createdAt: 1 })
      .toArray())
      .map(serializeGroupComponent)
      .filter(Boolean);

    return {
      group: serializeGroup(group),
      settings: settings ? serializeGroupSettings(settings, groupId) : getDefaultGroupSettings(group.name),
      manager: serializeManager(manager),
      components: groupComponents
    };
  } catch {
    return null;
  }
}

export default async function AdminEditGroupPage({ params }) {
  const resolvedParams = await resolveRouteParams(params);
  const groupId = normalizeString(resolvedParams?.groupId);
  const initialData = groupId ? await loadInitialData(groupId) : null;

  if (!groupId || !initialData) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <article
          style={{
            border: '1px solid var(--app-border, #d9e2ef)',
            borderRadius: '18px',
            background: '#fff',
            padding: '18px',
            maxWidth: '560px',
            width: '100%'
          }}
        >
          <h1 style={{ marginTop: 0 }}>Grupo nao encontrado</h1>
          <p style={{ marginBottom: 0 }}>Nao foi possivel carregar os dados para edicao do grupo selecionado.</p>
        </article>
      </main>
    );
  }

  return <AdminGroupForm mode="edit" groupId={groupId} initialData={initialData} />;
}
