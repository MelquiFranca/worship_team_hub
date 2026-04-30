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
      <strong className={styles.name}>{member.name}</strong>
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

export default function ComponentsGallery({ components = [], categoryTags = [], canEdit = false }) {
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
  const activeComponentsCount = components.filter((member) => member.isActive !== false).length;
  const inactiveComponentsCount = components.length - activeComponentsCount;

  return (
    <section className={styles.galleryPage} aria-label="Lista de componentes">
      <header className={styles.galleryHeader}>
        <div className={styles.galleryHeaderCopy}>
          <p className={styles.galleryHeaderKicker}>Componentes</p>
          <h1>Base de componentes</h1>
          <p className={styles.galleryHeaderDescription}>
            Visualize todos os componentes em blocos com foto e nome.
          </p>
        </div>

        <div className={styles.galleryHeaderStats} aria-label="Resumo dos componentes">
          <article>
            <span>Contexto</span>
            <strong>
              {components.length} componente{components.length === 1 ? '' : 's'}
            </strong>
          </article>
          <article>
            <span>Status</span>
            <strong>{activeComponentsCount} ativos</strong>
          </article>
          <article>
            <span>Detalhe</span>
            <strong>{inactiveComponentsCount} inativos</strong>
          </article>
        </div>

        <div className={styles.filterRow}>
          <label htmlFor="components-category-filter">Filtrar por categoria</label>
          <select
            id="components-category-filter"
            value={selectedCategoryTagId}
            onChange={(event) => setSelectedCategoryTagId(event.target.value)}
          >
            <option value="all">Todas as categorias</option>
            {categoryTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
        </div>
      </header>

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
