import './globals.css';

export const metadata = {
  title: 'Escalas App',
  description: 'Aplicacao base em Next.js para o projeto Escalas App.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
