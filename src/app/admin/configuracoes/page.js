import styles from './page.module.css';

export const metadata = {
  title: 'Configuracoes Admin | Escalas App',
  description: 'Placeholder de configuracoes da visao administrativa.'
};

export default function AdminConfigurationsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-configurations-title">
        <p className={styles.kicker}>Visao administrativa</p>
        <h1 id="admin-configurations-title">Configuracoes</h1>
        <p className={styles.text}>
          Este espaco fica reservado para as configuracoes administrativas do sistema.
        </p>
      </section>
    </main>
  );
}
