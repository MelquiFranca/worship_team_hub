'use client';

import dynamic from 'next/dynamic';

const PushNotificationPermissionPrompt = dynamic(
  () => import('./PushNotificationPermissionPrompt'),
  { ssr: false }
);

export default function PushNotificationPermissionPromptLazy() {
  return <PushNotificationPermissionPrompt />;
}
