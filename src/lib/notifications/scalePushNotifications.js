import crypto from 'node:crypto';
import webpush from 'web-push';
import { serializePushSubscriptions } from './pushSubscriptions.js';

const AUTO_CREATE_TRIGGER = 'auto-create';
const MANUAL_RESEND_TRIGGER = 'manual-resend';
const CHAT_MESSAGE_TRIGGER = 'chat-message';
const DEFAULT_PUSH_NOTIFICATION_STATE = Object.freeze({
  totalDispatches: 0,
  autoDispatches: 0,
  manualDispatches: 0,
  totalRecipients: 0,
  totalDelivered: 0,
  totalFailed: 0,
  totalSkipped: 0,
  lastDispatchAt: null,
  lastDispatchId: null,
  lastDispatchTrigger: null,
  lastDispatchSummary: null
});

let webPushConfigured = false;
let webPushConfigAttempted = false;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeUniqueStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const items = [];

  for (const entry of value) {
    const normalizedEntry = normalizeString(entry);

    if (!normalizedEntry || seen.has(normalizedEntry)) {
      continue;
    }

    seen.add(normalizedEntry);
    items.push(normalizedEntry);
  }

  return items;
}

function normalizeTrigger(trigger) {
  return trigger === AUTO_CREATE_TRIGGER ? AUTO_CREATE_TRIGGER : MANUAL_RESEND_TRIGGER;
}

function normalizeChatTrigger() {
  return CHAT_MESSAGE_TRIGGER;
}

function isUsableNotificationIcon(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return false;
  }

  if (normalized.startsWith('/')) {
    return true;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return true;
  }

  if (normalized.startsWith('data:image/')) {
    // Limita data URI para evitar payload grande demais no Web Push.
    return normalized.length <= 1400;
  }

  return false;
}

function resolveNotificationIconFromGroupSettings(document) {
  if (!isPlainObject(document)) {
    return '';
  }

  const photoUrl = normalizeString(document.photoUrl);
  if (isUsableNotificationIcon(photoUrl)) {
    return photoUrl;
  }

  const photo = normalizeString(document.photo);
  if (isUsableNotificationIcon(photo)) {
    return photo;
  }

  return '';
}

async function resolveGroupNotificationBranding(groupSettingsCollection, groupId) {
  if (!groupSettingsCollection || !groupId) {
    return {
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    };
  }

  const groupSettings = await groupSettingsCollection.findOne(
    { groupId },
    {
      projection: {
        photo: 1,
        photoUrl: 1
      }
    }
  );

  const icon = resolveNotificationIconFromGroupSettings(groupSettings) || '/favicon.ico';

  return {
    icon,
    badge: icon
  };
}

function getWebPushEnv() {
  return {
    publicKey: normalizeString(process.env.PUSH_VAPID_PUBLIC_KEY),
    privateKey: normalizeString(process.env.PUSH_VAPID_PRIVATE_KEY),
    subject: normalizeString(process.env.PUSH_VAPID_SUBJECT || 'mailto:no-reply@escalas.app')
  };
}

function ensureWebPushConfigured() {
  if (webPushConfigAttempted) {
    return webPushConfigured;
  }

  webPushConfigAttempted = true;
  const config = getWebPushEnv();

  if (!config.publicKey || !config.privateKey || !config.subject) {
    webPushConfigured = false;
    return false;
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  webPushConfigured = true;
  return true;
}

function buildRecipientBase(scaleComponent, componentDocument) {
  const componentId = normalizeString(scaleComponent?.componentId);
  const functionName = normalizeString(scaleComponent?.function);
  const fullName = normalizeString(componentDocument?.fullName);
  const username = normalizeString(componentDocument?.username);

  return {
    componentId,
    function: functionName || null,
    fullName: fullName || null,
    username: username || null,
    targetCount: 0,
    status: 'skipped-missing-subscription',
    deliveredAt: null,
    errorCode: null,
    errorMessage: null
  };
}

function buildPushPayload({ scale, trigger, branding }) {
  return JSON.stringify({
    type: 'scale-notification',
    trigger,
    title: 'Nova notificacao de escala',
    body: `Escala ${normalizeString(scale?.date)} (${normalizeString(scale?.shift)})`,
    icon: normalizeString(branding?.icon) || '/favicon.ico',
    badge: normalizeString(branding?.badge) || '/favicon.ico',
    data: {
      scaleId: normalizeString(scale?._id),
      groupId: normalizeString(scale?.groupId),
      date: normalizeString(scale?.date),
      shift: normalizeString(scale?.shift),
      trigger,
      path: '/escalas'
    }
  });
}

function buildChatMessagePushPayload({ scale, message, trigger, branding }) {
  const authorName = normalizeString(message?.meta?.authorName) || 'Equipe';
  const messageText = normalizeString(message?.payload?.text);
  const bodyPrefix = `${authorName}: `;
  const maxBodyLength = 140;
  const normalizedText =
    messageText.length > maxBodyLength
      ? `${messageText.slice(0, maxBodyLength - 3)}...`
      : messageText;

  return JSON.stringify({
    type: 'scale-chat-message',
    trigger,
    title: `Nova mensagem na escala ${normalizeString(scale?.date)} (${normalizeString(scale?.shift)})`,
    body: `${bodyPrefix}${normalizedText || 'Nova mensagem recebida.'}`,
    icon: normalizeString(branding?.icon) || '/favicon.ico',
    badge: normalizeString(branding?.badge) || '/favicon.ico',
    data: {
      scaleId: normalizeString(scale?._id),
      groupId: normalizeString(scale?.groupId),
      date: normalizeString(scale?.date),
      shift: normalizeString(scale?.shift),
      trigger,
      messageId: normalizeString(message?.id),
      path: '/escalas'
    }
  });
}

function isSubscriptionGoneError(error) {
  const statusCode = Number(error?.statusCode || error?.status);
  return statusCode === 404 || statusCode === 410;
}

async function deliverToRecipient({ component, payload }) {
  const subscriptions = serializePushSubscriptions(component.pushSubscriptions);

  if (!subscriptions.length) {
    return {
      targetCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      removedEndpoints: []
    };
  }

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      webpush.sendNotification(subscription, payload, {
        TTL: 60,
        urgency: 'high'
      })
    )
  );

  let deliveredCount = 0;
  let failedCount = 0;
  const removedEndpoints = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      deliveredCount += 1;
      return;
    }

    failedCount += 1;

    if (isSubscriptionGoneError(result.reason)) {
      const endpoint = subscriptions[index]?.endpoint;

      if (endpoint) {
        removedEndpoints.push(endpoint);
      }
    }
  });

  return {
    targetCount: subscriptions.length,
    deliveredCount,
    failedCount,
    removedEndpoints
  };
}

export function serializeScalePushNotification(value) {
  if (!isPlainObject(value)) {
    return { ...DEFAULT_PUSH_NOTIFICATION_STATE };
  }

  return {
    totalDispatches: normalizeNumber(value.totalDispatches, 0),
    autoDispatches: normalizeNumber(value.autoDispatches, 0),
    manualDispatches: normalizeNumber(value.manualDispatches, 0),
    totalRecipients: normalizeNumber(value.totalRecipients, 0),
    totalDelivered: normalizeNumber(value.totalDelivered, 0),
    totalFailed: normalizeNumber(value.totalFailed, 0),
    totalSkipped: normalizeNumber(value.totalSkipped, 0),
    lastDispatchAt: normalizeString(value.lastDispatchAt) || null,
    lastDispatchId: normalizeString(value.lastDispatchId) || null,
    lastDispatchTrigger: normalizeString(value.lastDispatchTrigger) || null,
    lastDispatchSummary: isPlainObject(value.lastDispatchSummary)
      ? {
        trigger: normalizeString(value.lastDispatchSummary.trigger) || null,
        recipients: normalizeNumber(value.lastDispatchSummary.recipients, 0),
        delivered: normalizeNumber(value.lastDispatchSummary.delivered, 0),
        failed: normalizeNumber(value.lastDispatchSummary.failed, 0),
        skipped: normalizeNumber(value.lastDispatchSummary.skipped, 0),
        deliveryMode: normalizeString(value.lastDispatchSummary.deliveryMode) || 'disabled-no-vapid'
      }
      : null
  };
}

export function createInitialScalePushNotificationState() {
  return { ...DEFAULT_PUSH_NOTIFICATION_STATE };
}

export function readClientPushPublicKey() {
  return normalizeString(process.env.PUSH_VAPID_PUBLIC_KEY);
}

export function isServerPushConfigured() {
  const config = getWebPushEnv();
  return Boolean(config.publicKey && config.privateKey && config.subject);
}

export async function dispatchScalePushNotifications({
  collections,
  scale,
  groupId,
  trigger,
  actor
}) {
  const resolvedGroupId = normalizeString(groupId || scale?.groupId);
  const scaleId = normalizeString(scale?._id);

  if (!collections?.scales || !collections?.components || !collections?.scalePushNotificationDispatches) {
    throw new Error('Colecoes de notificacao push indisponiveis.');
  }

  if (!resolvedGroupId || !scaleId) {
    throw new Error('Escala invalida para notificacao push.');
  }

  const dispatchTrigger = normalizeTrigger(trigger);
  const now = new Date().toISOString();
  const scaleComponents = Array.isArray(scale?.components) ? scale.components : [];
  const selectedComponentIds = normalizeUniqueStringArray(
    scaleComponents.map((entry) => normalizeString(entry?.componentId))
  );
  const componentDocuments = selectedComponentIds.length
    ? await collections.components
      .find({ groupId: resolvedGroupId, _id: { $in: selectedComponentIds } })
      .project({ _id: 1, fullName: 1, username: 1, isActive: 1, pushSubscriptions: 1 })
      .toArray()
    : [];
  const componentById = new Map(componentDocuments.map((document) => [document._id, document]));
  const recipients = [];
  const staleSubscriptionsByComponentId = new Map();
  const canSendNativePush = ensureWebPushConfigured();
  const pushBranding = await resolveGroupNotificationBranding(collections.groupSettings, resolvedGroupId);
  const pushPayload = buildPushPayload({ scale, trigger: dispatchTrigger, branding: pushBranding });

  for (const entry of scaleComponents) {
    const componentId = normalizeString(entry?.componentId);
    const componentDocument = componentById.get(componentId);
    const recipient = buildRecipientBase(entry, componentDocument);

    if (!componentId || !componentDocument) {
      recipient.status = 'failed-component-not-found';
      recipient.errorCode = 'COMPONENT_NOT_FOUND';
      recipient.errorMessage = 'Componente selecionado nao encontrado para disparo da notificacao.';
      recipients.push(recipient);
      continue;
    }

    if (componentDocument.isActive === false) {
      recipient.status = 'skipped-inactive-component';
      recipient.errorCode = 'COMPONENT_INACTIVE';
      recipient.errorMessage = 'Componente inativo ignorado no disparo da notificacao.';
      recipients.push(recipient);
      continue;
    }

    if (!canSendNativePush) {
      recipient.status = 'failed-provider';
      recipient.errorCode = 'VAPID_NOT_CONFIGURED';
      recipient.errorMessage = 'Push VAPID nao configurado no servidor.';
      recipients.push(recipient);
      continue;
    }

    const deliveryResult = await deliverToRecipient({
      component: componentDocument,
      payload: pushPayload
    });

    recipient.targetCount = deliveryResult.targetCount;

    if (!deliveryResult.targetCount) {
      recipient.status = 'skipped-missing-subscription';
      recipient.errorCode = 'MISSING_PUSH_SUBSCRIPTION';
      recipient.errorMessage = 'Componente sem subscription de web push registrada.';
      recipients.push(recipient);
      continue;
    }

    if (deliveryResult.deliveredCount > 0) {
      recipient.status = 'delivered';
      recipient.deliveredAt = now;
      recipient.errorCode = deliveryResult.failedCount > 0 ? 'PARTIAL_DELIVERY' : null;
      recipient.errorMessage =
        deliveryResult.failedCount > 0
          ? 'Entrega parcial: uma ou mais subscriptions falharam.'
          : null;
    } else {
      recipient.status = 'failed-delivery';
      recipient.errorCode = 'PUSH_DELIVERY_FAILED';
      recipient.errorMessage = 'Falha no envio para todas as subscriptions do componente.';
    }

    if (deliveryResult.removedEndpoints.length) {
      staleSubscriptionsByComponentId.set(componentId, deliveryResult.removedEndpoints);
    }

    recipients.push(recipient);
  }

  for (const [componentId, staleEndpoints] of staleSubscriptionsByComponentId.entries()) {
    const component = componentById.get(componentId);

    if (!component) {
      continue;
    }

    const nextSubscriptions = serializePushSubscriptions(component.pushSubscriptions).filter(
      (subscription) => !staleEndpoints.includes(subscription.endpoint)
    );

    await collections.components.updateOne(
      { _id: componentId, groupId: resolvedGroupId },
      {
        $set: {
          pushSubscriptions: nextSubscriptions,
          updatedAt: now,
          'metadata.source': 'push-cleanup'
        }
      }
    );
  }

  const counters = recipients.reduce(
    (accumulator, recipient) => {
      accumulator.totalRecipients += 1;

      if (recipient.status === 'delivered') {
        accumulator.delivered += 1;
        return accumulator;
      }

      if (recipient.status.startsWith('failed-')) {
        accumulator.failed += 1;
        return accumulator;
      }

      accumulator.skipped += 1;
      return accumulator;
    },
    {
      totalRecipients: 0,
      delivered: 0,
      failed: 0,
      skipped: 0
    }
  );

  const dispatchId = crypto.randomUUID();
  const deliveryMode = canSendNativePush ? 'native-web-push' : 'disabled-no-vapid';
  const dispatchDocument = {
    _id: dispatchId,
    groupId: resolvedGroupId,
    scaleId,
    trigger: dispatchTrigger,
    createdAt: now,
    actor: {
      userId: normalizeString(actor?.userId) || null,
      audience: normalizeString(actor?.audience) || null
    },
    scaleSnapshot: {
      date: normalizeString(scale?.date) || null,
      shift: normalizeString(scale?.shift) || null,
      componentCount: scaleComponents.length
    },
    provider: {
      deliveryMode,
      vapidConfigured: canSendNativePush
    },
    counters,
    recipients
  };

  await collections.scalePushNotificationDispatches.insertOne(dispatchDocument);

  const previousState = serializeScalePushNotification(scale?.notifications?.push);
  const nextState = {
    ...previousState,
    totalDispatches: previousState.totalDispatches + 1,
    autoDispatches: previousState.autoDispatches + (dispatchTrigger === AUTO_CREATE_TRIGGER ? 1 : 0),
    manualDispatches: previousState.manualDispatches + (dispatchTrigger === MANUAL_RESEND_TRIGGER ? 1 : 0),
    totalRecipients: previousState.totalRecipients + counters.totalRecipients,
    totalDelivered: previousState.totalDelivered + counters.delivered,
    totalFailed: previousState.totalFailed + counters.failed,
    totalSkipped: previousState.totalSkipped + counters.skipped,
    lastDispatchAt: now,
    lastDispatchId: dispatchId,
    lastDispatchTrigger: dispatchTrigger,
    lastDispatchSummary: {
      trigger: dispatchTrigger,
      recipients: counters.totalRecipients,
      delivered: counters.delivered,
      failed: counters.failed,
      skipped: counters.skipped,
      deliveryMode
    }
  };

  await collections.scales.updateOne(
    { _id: scaleId, groupId: resolvedGroupId },
    {
      $set: {
        'notifications.push': nextState
      }
    }
  );

  return {
    dispatchId,
    trigger: dispatchTrigger,
    counters,
    provider: {
      deliveryMode,
      vapidConfigured: canSendNativePush
    },
    notifications: nextState
  };
}

export async function dispatchScaleChatMessagePushNotifications({
  collections,
  scale,
  groupId,
  message,
  actor,
  excludeComponentIds = []
}) {
  const resolvedGroupId = normalizeString(groupId || scale?.groupId);
  const scaleId = normalizeString(scale?._id);

  if (!collections?.components || !collections?.scalePushNotificationDispatches) {
    throw new Error('Colecoes de notificacao push indisponiveis.');
  }

  if (!resolvedGroupId || !scaleId) {
    throw new Error('Escala invalida para notificacao push de chat.');
  }

  const dispatchTrigger = normalizeChatTrigger();
  const now = new Date().toISOString();
  const scaleComponents = Array.isArray(scale?.components) ? scale.components : [];
  const selectedComponentIds = normalizeUniqueStringArray(
    scaleComponents.map((entry) => normalizeString(entry?.componentId))
  );
  const excludedComponentIds = new Set(normalizeUniqueStringArray(excludeComponentIds));
  const componentDocuments = selectedComponentIds.length
    ? await collections.components
      .find({ groupId: resolvedGroupId, _id: { $in: selectedComponentIds } })
      .project({ _id: 1, fullName: 1, username: 1, isActive: 1, pushSubscriptions: 1 })
      .toArray()
    : [];
  const componentById = new Map(componentDocuments.map((document) => [document._id, document]));
  const recipients = [];
  const staleSubscriptionsByComponentId = new Map();
  const canSendNativePush = ensureWebPushConfigured();
  const pushBranding = await resolveGroupNotificationBranding(collections.groupSettings, resolvedGroupId);
  const pushPayload = buildChatMessagePushPayload({
    scale,
    message,
    trigger: dispatchTrigger,
    branding: pushBranding
  });

  for (const entry of scaleComponents) {
    const componentId = normalizeString(entry?.componentId);

    if (excludedComponentIds.has(componentId)) {
      continue;
    }

    const componentDocument = componentById.get(componentId);
    const recipient = buildRecipientBase(entry, componentDocument);

    if (!componentId || !componentDocument) {
      recipient.status = 'failed-component-not-found';
      recipient.errorCode = 'COMPONENT_NOT_FOUND';
      recipient.errorMessage = 'Componente selecionado nao encontrado para disparo da notificacao.';
      recipients.push(recipient);
      continue;
    }

    if (componentDocument.isActive === false) {
      recipient.status = 'skipped-inactive-component';
      recipient.errorCode = 'COMPONENT_INACTIVE';
      recipient.errorMessage = 'Componente inativo ignorado no disparo da notificacao.';
      recipients.push(recipient);
      continue;
    }

    if (!canSendNativePush) {
      recipient.status = 'failed-provider';
      recipient.errorCode = 'VAPID_NOT_CONFIGURED';
      recipient.errorMessage = 'Push VAPID nao configurado no servidor.';
      recipients.push(recipient);
      continue;
    }

    const deliveryResult = await deliverToRecipient({
      component: componentDocument,
      payload: pushPayload
    });

    recipient.targetCount = deliveryResult.targetCount;

    if (!deliveryResult.targetCount) {
      recipient.status = 'skipped-missing-subscription';
      recipient.errorCode = 'MISSING_PUSH_SUBSCRIPTION';
      recipient.errorMessage = 'Componente sem subscription de web push registrada.';
      recipients.push(recipient);
      continue;
    }

    if (deliveryResult.deliveredCount > 0) {
      recipient.status = 'delivered';
      recipient.deliveredAt = now;
      recipient.errorCode = deliveryResult.failedCount > 0 ? 'PARTIAL_DELIVERY' : null;
      recipient.errorMessage =
        deliveryResult.failedCount > 0
          ? 'Entrega parcial: uma ou mais subscriptions falharam.'
          : null;
    } else {
      recipient.status = 'failed-delivery';
      recipient.errorCode = 'PUSH_DELIVERY_FAILED';
      recipient.errorMessage = 'Falha no envio para todas as subscriptions do componente.';
    }

    if (deliveryResult.removedEndpoints.length) {
      staleSubscriptionsByComponentId.set(componentId, deliveryResult.removedEndpoints);
    }

    recipients.push(recipient);
  }

  for (const [componentId, staleEndpoints] of staleSubscriptionsByComponentId.entries()) {
    const component = componentById.get(componentId);

    if (!component) {
      continue;
    }

    const nextSubscriptions = serializePushSubscriptions(component.pushSubscriptions).filter(
      (subscription) => !staleEndpoints.includes(subscription.endpoint)
    );

    await collections.components.updateOne(
      { _id: componentId, groupId: resolvedGroupId },
      {
        $set: {
          pushSubscriptions: nextSubscriptions,
          updatedAt: now,
          'metadata.source': 'push-cleanup'
        }
      }
    );
  }

  const counters = recipients.reduce(
    (accumulator, recipient) => {
      accumulator.totalRecipients += 1;

      if (recipient.status === 'delivered') {
        accumulator.delivered += 1;
        return accumulator;
      }

      if (recipient.status.startsWith('failed-')) {
        accumulator.failed += 1;
        return accumulator;
      }

      accumulator.skipped += 1;
      return accumulator;
    },
    {
      totalRecipients: 0,
      delivered: 0,
      failed: 0,
      skipped: 0
    }
  );

  const dispatchId = crypto.randomUUID();
  const deliveryMode = canSendNativePush ? 'native-web-push' : 'disabled-no-vapid';
  const dispatchDocument = {
    _id: dispatchId,
    groupId: resolvedGroupId,
    scaleId,
    trigger: dispatchTrigger,
    type: 'scale-chat-message',
    createdAt: now,
    actor: {
      userId: normalizeString(actor?.userId) || null,
      audience: normalizeString(actor?.audience) || null
    },
    scaleSnapshot: {
      date: normalizeString(scale?.date) || null,
      shift: normalizeString(scale?.shift) || null,
      componentCount: scaleComponents.length
    },
    messageSnapshot: {
      id: normalizeString(message?.id) || null,
      authorName: normalizeString(message?.meta?.authorName) || null,
      text: normalizeString(message?.payload?.text) || null
    },
    provider: {
      deliveryMode,
      vapidConfigured: canSendNativePush
    },
    counters,
    recipients
  };

  await collections.scalePushNotificationDispatches.insertOne(dispatchDocument);

  return {
    dispatchId,
    trigger: dispatchTrigger,
    counters,
    provider: {
      deliveryMode,
      vapidConfigured: canSendNativePush
    }
  };
}
