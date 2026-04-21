import './globals.css';
import { AuthSessionProvider } from '@/context/AuthSessionContext';
import { GroupSettingsProvider } from '@/context/GroupSettingsContext';
import AppNavigation from '@/components/organisms/AppNavigation/AppNavigation';
import PwaServiceWorkerRegistration from '@/components/PwaServiceWorkerRegistration';

export const metadata = {
  title: 'Worship Team Hub',
  description: 'Aplicacao base em Next.js para o projeto Worship Team Hub.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Worship Team Hub'
  }
};

export const viewport = {
  themeColor: '#0f172a'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaServiceWorkerRegistration />
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
