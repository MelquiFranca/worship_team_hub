'use client';

import { useEffect } from 'react';
import { ensureAppServiceWorkerRegistration } from '@/lib/pwa/registerAppServiceWorker';

export default function PwaServiceWorkerRegistration() {
  useEffect(() => {
    ensureAppServiceWorkerRegistration();
  }, []);

  return null;
}
