import ComponentsGallery from '@/components/organisms/ComponentsGallery/ComponentsGallery';
import { scales } from '@/data/scales';
import styles from './page.module.css';

export const metadata = {
  title: 'Componentes | Escalas App',
  description: 'Tela de componentes com visual alinhado a tela de escalas.'
};

export default function ComponentsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.galleryContainer}>
        <ComponentsGallery scales={scales} />
      </div>
    </main>
  );
}
