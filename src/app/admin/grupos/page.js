import Image from 'next/image';
import { groups } from '@/data/groups';
import styles from './page.module.css';

export const metadata = {
  title: 'Grupos Admin | Escalas App',
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

export default function AdminGroupsPage({ searchParams }) {
  const isCreateMode = searchParams?.novo === '1';

  return (
    <main className={styles.page}>
      <section className={styles.headerCard} aria-labelledby="admin-groups-title">
        <div>
          <p className={styles.kicker}>Visao administrativa</p>
          <h1 id="admin-groups-title">Grupos</h1>
          <p className={styles.subtitle}>
            Listagem ficticia para a base administrativa, com imagem, nome e status de cada grupo.
          </p>
        </div>

        {isCreateMode ? <p className={styles.callout}>Fluxo de novo grupo aberto em modo mock.</p> : null}
      </section>

      <section className={styles.listSection} aria-label="Lista de grupos">
        {groups.map((group) => (
          <article key={group.id} className={styles.groupCard}>
            <div className={styles.groupMedia}>
              <Image
                src={group.photo}
                alt={`Imagem do grupo ${group.name}`}
                width={72}
                height={72}
                className={styles.groupImage}
              />
            </div>

            <div className={styles.groupInfo}>
              <h2>{group.name}</h2>
              <p>Grupo administravel da base ficticia.</p>
            </div>

            <StatusBadge status={group.status} />
          </article>
        ))}
      </section>
    </main>
  );
}
