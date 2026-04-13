import './globals.css';
import { AuthSessionProvider } from '@/context/AuthSessionContext';
import { GroupSettingsProvider } from '@/context/GroupSettingsContext';
import AppNavigation from '@/components/organisms/AppNavigation/AppNavigation';

export const metadata = {
  title: 'Escalas App',
  description: 'Aplicacao base em Next.js para o projeto Escalas App.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthSessionProvider>
          <GroupSettingsProvider>
            {children}
            <AppNavigation />
          </GroupSettingsProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
