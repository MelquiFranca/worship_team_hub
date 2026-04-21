import LoginCard from '@/components/organisms/LoginCard/LoginCard';
import styles from './page.module.css';

export const metadata = {
  title: 'Login | Worship Team Hub',
  description: 'Tela de login em português do Brasil para o grupo Ministério de Louvor Avivah.'
};

export default function LoginPage() {
  return (
    <main className={styles.page} aria-labelledby="login-title">
      <LoginCard />
    </main>
  );
}
