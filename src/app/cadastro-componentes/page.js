import ComponentRegistrationForm from '@/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Cadastro de Componentes | Escalas App',
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
          <h1>{isEditMode ? 'Edicao de componente' : 'Cadastro de componentes'}</h1>
          <p>
            {isEditMode
              ? 'Atualize os dados do componente, incluindo permissoes e status de atividade.'
              : 'Crie um novo componente com foto, dados pessoais, usuário e senha em um fluxo simples.'}
          </p>
        </header>

        <ComponentRegistrationForm componentId={componentId} />
      </div>
    </main>
  );
}
