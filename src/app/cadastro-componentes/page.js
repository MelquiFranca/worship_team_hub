import ComponentRegistrationForm from '@/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Cadastro de Componentes | Worship Team Hub',
  description: 'Tela de cadastro de componentes com calendario reutilizavel e preview de foto.'
};

function readSearchParamValue(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }

  return typeof value === 'string' ? value : '';
}

export default async function CadastroComponentesPage({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const componentId = readSearchParamValue(resolvedSearchParams?.componentId);
  const isEditMode = Boolean(componentId);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>{isEditMode ? 'Edicao de componentes' : 'Cadastro de componentes'}</p>
            <h1>{isEditMode ? 'Edicao de componente' : 'Cadastro de componentes'}</h1>
            <p className={styles.description}>
              {isEditMode
                ? 'Atualize os dados do componente, incluindo permissoes e status de atividade.'
                : 'Crie um novo componente com foto, dados pessoais, usuario e senha em um fluxo simples.'}
            </p>
          </div>

          <div className={styles.headerStats} aria-label="Resumo do fluxo de componente">
            <article>
              <span>Contexto</span>
              <strong>{isEditMode ? 'Edicao' : 'Novo cadastro'}</strong>
            </article>
            <article>
              <span>Status</span>
              <strong>Upload e preview</strong>
            </article>
            <article>
              <span>Detalhe</span>
              <strong>{isEditMode ? 'Atualizacao de dados' : 'Criacao de credenciais'}</strong>
            </article>
          </div>
        </header>

        <ComponentRegistrationForm componentId={componentId} />
      </div>
    </main>
  );
}
