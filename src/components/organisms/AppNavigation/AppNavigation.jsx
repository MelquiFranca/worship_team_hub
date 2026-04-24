'use client';

import { usePathname } from 'next/navigation';
import MainBottomNav from '@/components/organisms/MainBottomNav/MainBottomNav';
import AdminMainNav from '@/components/organisms/AdminMainNav/AdminMainNav';
import PushNotificationPermissionPromptLazy from '@/components/molecules/PushNotificationPermissionPrompt/PushNotificationPermissionPromptLazy';

export default function AppNavigation() {
  const pathname = usePathname() || '';
  const isAdminRoute = pathname.startsWith('/admin');

  if (pathname === '/admin/login') {
    return null;
  }

  if (isAdminRoute) {
    return <AdminMainNav />;
  }

  return (
    <>
      <PushNotificationPermissionPromptLazy />
      <MainBottomNav />
    </>
  );
}
