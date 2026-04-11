import ComponentRegistrationForm from '@/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Cadastro de Componentes | Escalas App',
  description: 'Tela de cadastro de componentes com calendario reutilizavel e preview de foto.'
};

export default function CadastroComponentesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Cadastro de componentes</h1>
          <p>Crie um novo componente com foto, dados pessoais, usuário e senha em um fluxo simples.</p>
        </header>

        <ComponentRegistrationForm />
      </div>
    </main>
  );
}
