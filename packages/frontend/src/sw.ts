/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import {
  ZNotificationPayload,
  type NotificationPayload,
} from '@nihalgonsalves/expenses-shared/types/notification';

import { formatCurrency } from './utils/money';
import { getExpenseDescription } from './utils/utils';

declare let self: ServiceWorkerGlobalScope;

void self.skipWaiting();

clientsClaim();
cleanupOutdatedCaches();

if (!import.meta.env.DEV) {
  precacheAndRoute(self.__WB_MANIFEST);
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('/index.html'), {
      denylist: [/\/api\/.*/, /\/assets\/.*/],
    }),
  );
}

const getNotificationPresentation = (payload: NotificationPayload) => {
  if (payload.type === 'TEST') {
    return { title: 'Test Notification', body: payload.message };
  }

  const formattedMoney = formatCurrency(payload.expense.money, {
    signDisplay: 'never',
  });

  const description = getExpenseDescription(payload.expense);
  const title = `💶 ${payload.groupSheet.name} – ${description} (${formattedMoney})`;

  if (payload.type === 'TRANSFER') {
    return {
      title,
      body: `You ${payload.expense.type} ${formattedMoney} for ${description}`,
    };
  }

  const formattedShare = formatCurrency(payload.expense.yourShare, {
    signDisplay: 'never',
  });

  if (payload.type === 'EXPENSE') {
    return {
      title,
      body: `New expense: ${description} – your share is ${formattedShare}`,
    };
  }

  // (payload.type === 'INCOME')
  return {
    title,
    body: `New income: ${description} – your share is ${formattedShare}`,
  };
};

const handlePush = async (event: PushEvent) => {
  const result = ZNotificationPayload.safeParse(event.data?.json());

  const { title, body } = result.success
    ? getNotificationPresentation(result.data)
    : { title: 'Unknown Notification', body: 'Open the app to see more' };

  await self.registration.showNotification(title, {
    body,
  });
};

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});
