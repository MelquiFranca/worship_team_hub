import Image from 'next/image';
import styles from './ComponentsGallery.module.css';

function normalizeComponents(scales) {
  const uniqueMembers = new Map();

  scales.forEach((scale) => {
    scale.members.forEach((member) => {
      if (!uniqueMembers.has(member.id)) {
        uniqueMembers.set(member.id, member);
      }
    });
  });

  return Array.from(uniqueMembers.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function ComponentBlock({ member }) {
  return (
    <article className={styles.componentBlock}>
      <div className={styles.photoWrap}>
        {member.photo ? (
          <Image
            className={styles.photo}
            src={member.photo}
            alt={`Foto de ${member.name}`}
            width={200}
            height={200}
          />
        ) : (
          <div className={styles.photoFallback} aria-hidden="true">
            {member.name.slice(0, 1)}
          </div>
        )}
      </div>
      <strong className={styles.name}>{member.name}</strong>
    </article>
  );
}

export default function ComponentsGallery({ scales }) {
  const components = normalizeComponents(scales);

  return (
    <section className={styles.galleryPage} aria-label="Lista de componentes">
      <header className={styles.galleryHeader}>
        <h1>Componentes</h1>
        <p>Visualize todos os componentes em blocos com foto e nome.</p>
      </header>

      {components.length ? (
        <div className={styles.grid}>
          {components.map((member) => (
            <ComponentBlock key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>Nenhum componente encontrado.</p>
      )}
    </section>
  );
}
