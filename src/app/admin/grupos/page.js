/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import styles from './page.module.css';
import { getMongoCollections } from '../../../lib/db/mongodb.js';
import { serializeComponentPhoto } from '../../../lib/components/photo.js';

export const metadata = {
  title: 'Grupos Admin | Worship Team Hub',
  description: 'Listagem administrativa de grupos com status e imagem.'
};

function StatusBadge({ status }) {
  const isActive = status === 'active';

  return (
    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStatus(value) {
  const status = normalizeString(value).toLowerCase();
  return status === 'active' ? 'active' : 'inactive';
}

function getInitials(name) {
  const chunks = normalizeString(name).split(/\s+/).filter(Boolean).slice(0, 2);

  if (!chunks.length) {
    return 'GP';
  }

  return chunks.map((chunk) => chunk.charAt(0).toUpperCase()).join('');
}

async function loadGroupsFromDatabase() {
  try {
    const { db, groupSettings } = await getMongoCollections();
    const groupsCollection = db.collection('groups');
    const groupDocuments = await groupsCollection.find({}).sort({ name: 1, createdAt: -1 }).toArray();
    const groupIds = groupDocuments
      .map((document) => (document?._id ? String(document._id) : ''))
      .filter(Boolean);

    const settingsByGroupId = new Map();

    if (groupIds.length > 0) {
      const settings = await groupSettings
        .find({ groupId: { $in: groupIds } })
        .project({ groupId: 1, photo: 1, photoUrl: 1 })
        .toArray();

      settings.forEach((settingsDocument) => {
        const groupId = normalizeString(settingsDocument?.groupId);

        if (groupId) {
          settingsByGroupId.set(groupId, settingsDocument);
        }
      });
    }

    const items = groupDocuments.map((document) => {
      const id = document?._id ? String(document._id) : '';
      const settingsDocument = settingsByGroupId.get(id);
      const photoDataUrl = serializeComponentPhoto(settingsDocument);
      const photoUrl = normalizeString(settingsDocument?.photoUrl) || normalizeString(document?.photoUrl);

      return {
        id,
        name: normalizeString(document?.name) || 'Grupo sem nome',
        status: normalizeStatus(document?.status),
        photo: photoDataUrl || photoUrl
      };
    });

    return { items, loadError: '' };
  } catch {
    return { items: [], loadError: 'Nao foi possivel carregar os grupos do banco agora.' };
  }
}

export default async function AdminGroupsPage() {
  const { items: groups, loadError } = await loadGroupsFromDatabase();

  return (
    <main className={styles.page}>
      <section className={styles.headerCard} aria-labelledby="admin-groups-title">
        <div>
          <p className={styles.kicker}>Visao administrativa</p>
          <h1 id="admin-groups-title">Grupos</h1>
          <p className={styles.subtitle}>
            Listagem administrativa com dados reais persistidos no banco, incluindo imagem, nome e status.
          </p>
        </div>

      </section>

      <section className={styles.listSection} aria-label="Lista de grupos">
        {loadError ? <p className={styles.callout}>{loadError}</p> : null}

        {!loadError && groups.length === 0 ? (
          <article className={styles.groupCard}>
            <div className={styles.groupMediaFallback} aria-hidden>
              GP
            </div>
            <div className={styles.groupInfo}>
              <h2>Nenhum grupo encontrado</h2>
              <p>Cadastre grupos no banco para exibir a listagem administrativa.</p>
            </div>
            <StatusBadge status="inactive" />
          </article>
        ) : null}

        {groups.map((group) => (
          <article key={group.id || group.name} className={styles.groupCard}>
            <div className={styles.groupMedia}>
              {group.photo ? (
                <img
                  src={group.photo}
                  alt={`Imagem do grupo ${group.name}`}
                  width={72}
                  height={72}
                  className={styles.groupImage}
                  loading="lazy"
                />
              ) : (
                <div className={styles.groupMediaFallback} aria-hidden>
                  {getInitials(group.name)}
                </div>
              )}
            </div>

            <div className={styles.groupInfo}>
              <h2>{group.name}</h2>
              <p>Grupo administravel com origem no banco de dados.</p>
              {group.id ? (
                <Link href={`/admin/grupos/${group.id}/editar`} className={styles.secondaryAction}>
                  Editar grupo
                </Link>
              ) : null}
            </div>

            <StatusBadge status={group.status} />
          </article>
        ))}
      </section>
    </main>
  );
}
