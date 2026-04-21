import ComponentUnavailabilityForm from '@/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Minha indisponibilidade | Escalas App',
  description: 'Consulte indisponibilidades agrupadas do grupo ou gerencie sua propria indisponibilidade.'
};

export default function MyUnavailabilityPage() {
  return (
    <main className={styles.page}>
      <ComponentUnavailabilityForm />
    </main>
  );
}
