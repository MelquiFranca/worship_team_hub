import ComponentsPageClient from './ComponentsPageClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Componentes | Escalas App',
  description: 'Tela de componentes com visual alinhado a tela de escalas.'
};

export default function ComponentsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.galleryContainer}>
        <ComponentsPageClient />
      </div>
    </main>
  );
}
