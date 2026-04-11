import GroupGeneralSettings from '@/components/organisms/GroupGeneralSettings/GroupGeneralSettings';
import styles from './page.module.css';

export const metadata = {
  title: 'Configuracoes gerais do grupo | Escalas App',
  description: 'Tela de configuracoes gerais do grupo com nome, foto, funcoes e tema.'
};

export default function GroupSettingsPage() {
  return (
    <main className={styles.page}>
      <GroupGeneralSettings />
    </main>
  );
}
