'use client';

import { usePathname } from 'next/navigation';
import MainBottomNav from '@/components/organisms/MainBottomNav/MainBottomNav';
import AdminMainNav from '@/components/organisms/AdminMainNav/AdminMainNav';

export default function AppNavigation() {
  const pathname = usePathname() || '';

  if (pathname === '/admin/login') {
    return null;
  }

  if (pathname.startsWith('/admin')) {
    return <AdminMainNav />;
  }

  return <MainBottomNav />;
}
