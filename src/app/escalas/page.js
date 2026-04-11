import ScaleFeed from '@/components/organisms/ScaleFeed/ScaleFeed';
import { scales } from '@/data/scales';
import styles from './page.module.css';

export const metadata = {
  title: 'Escalas | Escalas App',
  description: 'Tela de escalas em formato de feed com componentes e playlists.'
};

export default function ScalesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.feedContainer}>
        <ScaleFeed scales={scales} />
      </div>
    </main>
  );
}
