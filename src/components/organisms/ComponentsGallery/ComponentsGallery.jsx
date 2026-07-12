import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './ComponentsGallery.module.css';

function ComponentBlock({ member, canEdit, categoryById }) {
  const isInactive = member.isActive === false;
  const blockClassName = `${styles.componentBlock} ${canEdit ? styles.componentBlockInteractive : ''} ${
    isInactive ? styles.componentBlockInactive : ''
  }`;

  const content = (
    <>
      <div className={styles.photoWrap}>
        {member.photo ? (
          <Image
            className={styles.photo}
            src={member.photo}
            alt={`Foto de ${member.name}`}
            width={200}
            height={200}
            unoptimized
          />
        ) : (
          <div className={styles.photoFallback} aria-hidden="true">
            {member.name.slice(0, 1)}
          </div>
        )}
      </div>
      <p className={styles.name}>{member.name}</p>
      {Array.isArray(member.categoryTagIds) && member.categoryTagIds.length > 0 ? (
        <div className={styles.tagsWrap}>
          {member.categoryTagIds.map((tagId) => {
            const tag = categoryById.get(tagId);
            return (
              <span
                key={`${member.id}-${tagId}`}
                className={styles.categoryTag}
                style={{ '--tag-color': tag?.color || '#475569' }}
              >
                {tag?.label || tagId}
              </span>
            );
          })}
        </div>
      ) : null}
      {isInactive ? <span className={styles.statusBadge}>Inativo</span> : null}
    </>
  );

  if (canEdit) {
    return (
      <Link href={`/cadastro-componentes?componentId=${member.id}`} className={blockClassName}>
        {content}
      </Link>
    );
  }

  return (
    <article className={blockClassName}>
      {content}
    </article>
  );
}

export default function ComponentsGallery({
  components = [],
  categoryTags = [],
  canEdit = false
}) {
  const [selectedCategoryTagId, setSelectedCategoryTagId] = useState('all');
  const categoryById = useMemo(
    () => new Map(categoryTags.map((tag) => [tag.id, tag])),
    [categoryTags]
  );
  const filteredComponents = useMemo(
    () =>
      selectedCategoryTagId === 'all'
        ? components
        : components.filter(
          (member) =>
            Array.isArray(member.categoryTagIds) &&
            member.categoryTagIds.includes(selectedCategoryTagId)
        ),
    [components, selectedCategoryTagId]
  );

  return (
    <section className={styles.galleryPage} aria-label="Lista de componentes">
      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Filtrar por categoria</span>
        <div
          className={styles.categoryFilterGroup}
          role="group"
          aria-label="Filtrar componentes por categoria"
        >
          <button
            type="button"
            className={`${styles.categoryFilterButton} ${
              selectedCategoryTagId === 'all' ? styles.categoryFilterButtonActive : ''
            }`}
            onClick={() => setSelectedCategoryTagId('all')}
            aria-pressed={selectedCategoryTagId === 'all'}
          >
            Todas
          </button>
          {categoryTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`${styles.categoryFilterButton} ${
                selectedCategoryTagId === tag.id ? styles.categoryFilterButtonActive : ''
              }`}
              onClick={() => setSelectedCategoryTagId(tag.id)}
              aria-pressed={selectedCategoryTagId === tag.id}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {filteredComponents.length ? (
        <div className={styles.grid}>
          {filteredComponents.map((member) => (
            <ComponentBlock key={member.id} member={member} canEdit={canEdit} categoryById={categoryById} />
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>Nenhum componente encontrado para esta categoria.</p>
      )}
    </section>
  );
}
