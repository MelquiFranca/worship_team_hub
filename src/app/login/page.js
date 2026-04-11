import LoginCard from '@/components/organisms/LoginCard/LoginCard';
import styles from './page.module.css';

export const metadata = {
  title: 'Login | Escalas App',
  description: 'Tela de login da aplicacao Escalas App.'
};

export default function LoginPage() {
  return (
    <main className={styles.page} aria-labelledby="login-title">
      <LoginCard />
    </main>
  );
}
