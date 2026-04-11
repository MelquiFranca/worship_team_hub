import './globals.css';
import { GroupSettingsProvider } from '@/context/GroupSettingsContext';

export const metadata = {
  title: 'Escalas App',
  description: 'Aplicacao base em Next.js para o projeto Escalas App.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <GroupSettingsProvider>{children}</GroupSettingsProvider>
      </body>
    </html>
  );
}
