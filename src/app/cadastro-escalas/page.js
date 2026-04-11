import ScaleRegistrationForm from '@/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Cadastro de Escalas | Escalas App',
  description: 'Cadastro de escalas com componentes, funcoes, calendario e playlist do YouTube.'
};

export default function CadastroEscalasPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <ScaleRegistrationForm />
      </div>
    </main>
  );
}
