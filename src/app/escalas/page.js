import ScalesPageClient from './ScalesPageClient';
import styles from './page.module.css';

export const metadata = {
  title: 'Escalas | Worship Team Hub',
  description: 'Tela de escalas em formato de feed com componentes e playlists.'
};

export default function ScalesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.feedContainer}>
        <ScalesPageClient />
      </div>
    </main>
  );
}
