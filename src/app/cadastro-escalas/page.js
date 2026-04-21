import ScaleRegistrationForm from '@/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm';
import styles from './page.module.css';

function readScaleId(searchParams) {
  const rawValue = searchParams?.scaleId;

  if (typeof rawValue === 'string') {
    return rawValue.trim();
  }

  if (Array.isArray(rawValue) && typeof rawValue[0] === 'string') {
    return rawValue[0].trim();
  }

  return '';
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const scaleId = readScaleId(resolvedSearchParams);
  const isEditMode = Boolean(scaleId);

  return {
    title: isEditMode ? 'Edicao de Escala | Worship Team Hub' : 'Cadastro de Escalas | Worship Team Hub',
    description: isEditMode
      ? 'Edite data, turno, componentes e playlist da escala selecionada.'
      : 'Cadastro de escalas com componentes, funcoes, calendario e playlist do YouTube.'
  };
}

export default async function CadastroEscalasPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const scaleId = readScaleId(resolvedSearchParams);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <ScaleRegistrationForm scaleId={scaleId} />
      </div>
    </main>
  );
}
