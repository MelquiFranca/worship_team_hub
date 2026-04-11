import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <h1>Escalas App</h1>
      <p>
        Acesse a <Link href="/login">tela de login</Link>, o <Link href="/escalas">feed de escalas</Link> ou a{' '}
        <Link href="/componentes">tela de componentes</Link>.
      </p>
      <p>
        Para cadastrar novos itens, visite a <Link href="/cadastro-componentes">tela de cadastro de componentes</Link>.
      </p>
      <p>
        Para montar uma escala completa, visite o <Link href="/cadastro-escalas">cadastro de escalas</Link>.
      </p>
    </main>
  );
}
