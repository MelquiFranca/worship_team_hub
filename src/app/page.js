import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <h1>Escalas App</h1>
      <p>
        Acesse a <Link href="/login">tela de login</Link> ou o novo <Link href="/escalas">feed de escalas</Link>.
      </p>
    </main>
  );
}
