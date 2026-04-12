import LoginCard from '@/components/organisms/LoginCard/LoginCard';
import styles from './page.module.css';

export const metadata = {
  title: 'Login Administrativo | Escalas App',
  description: 'Tela de login separada para administradores do Escalas App.'
};

export default function AdminLoginPage() {
  return (
    <main className={styles.page} aria-labelledby="login-title">
      <LoginCard mode="admin" />
    </main>
  );
}
