import ComponentUnavailabilityForm from '@/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Minha indisponibilidade | Escalas App',
  description: 'Gerencie os dias indisponiveis do componente.'
};

export default function MyUnavailabilityPage() {
  return (
    <main className={styles.page}>
      <ComponentUnavailabilityForm />
    </main>
  );
}
