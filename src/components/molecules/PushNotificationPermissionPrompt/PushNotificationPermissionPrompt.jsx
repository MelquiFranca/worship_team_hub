'use client';

import { useState } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { isRetryablePushRegistrationReason } from '@/lib/notifications/registerClientPushSubscription';
import styles from './PushNotificationPermissionPrompt.module.css';

function resolveFeedbackMessage(reason) {
  if (reason === 'permission-denied') {
    return 'As notificacoes foram bloqueadas no navegador.';
  }

  if (reason === 'permission-default') {
    return 'Confirme a permissao de notificacoes para concluir a ativacao.';
  }

  if (reason === 'unsupported') {
    return 'Este navegador nao oferece suporte para notificacoes push.';
  }

  if (reason === 'not-eligible') {
    return 'Somente contas component-app ou group-app podem ativar este tipo de notificacao.';
  }

  if (reason) {
    return 'Nao foi possivel concluir a ativacao agora. Tente novamente em instantes.';
  }

  return '';
}

export default function PushNotificationPermissionPrompt() {
  const {
    isLoading,
    isAuthenticated,
    permissions,
    pushNotifications,
    requestPushNotificationPermission
  } = useAuthSession();
  const [feedback, setFeedback] = useState('');

  if (isLoading || !isAuthenticated || (!permissions.isComponentApp && !permissions.isGroupApp)) {
    return null;
  }

  const shouldAskPermission = pushNotifications.supported && pushNotifications.permission === 'default';
  const shouldRetryActivation =
    pushNotifications.supported &&
    pushNotifications.permission === 'granted' &&
    !pushNotifications.isReady &&
    isRetryablePushRegistrationReason(pushNotifications.lastReason);

  if (!shouldAskPermission && !shouldRetryActivation) {
    return null;
  }

  const title = shouldAskPermission ? 'Ative as notificacoes' : 'Concluindo ativacao das notificacoes';
  const description = shouldAskPermission
    ? 'Permita as notificacoes para receber avisos de escala automaticamente.'
    : 'A permissao ja foi concedida. Estamos tentando finalizar o registro push.';

  const actionLabel = shouldAskPermission ? 'Permitir notificacoes' : 'Tentar novamente';

  async function handleAction() {
    setFeedback('');

    const result = await requestPushNotificationPermission();

    if (result?.ok) {
      setFeedback('Notificacoes ativadas com sucesso.');
      return;
    }

    setFeedback(resolveFeedbackMessage(result?.reason));
  }

  return (
    <div className={styles.shell}>
      <section className={styles.card} aria-live="polite" aria-label="Permissao de notificacoes">
        <div className={styles.content}>
          <p className={styles.title}>{title}</p>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleAction}
            disabled={pushNotifications.isRegistering}
          >
            {pushNotifications.isRegistering ? 'Ativando...' : actionLabel}
          </button>
          {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
        </div>
      </section>
    </div>
  );
}
