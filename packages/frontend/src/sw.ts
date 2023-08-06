/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import type { NotificationPayload } from '@nihalgonsalves/expenses-backend';

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

  const description = getExpenseDescription(payload.expense);
  const formattedMoney = formatCurrency(payload.expense.money, {
    signDisplay: 'never',
  });

  const title = `💶 ${payload.groupSheet.name} – ${description} (${formattedMoney})`;

  if (payload.type === 'EXPENSE') {
    return {
      title,
      body: `New expense: ${description} – your share is ${formattedMoney}`,
    };
  }

  if (payload.type === 'INCOME') {
    return {
      title,
      body: `New income: ${description} – your share is ${formattedMoney}`,
    };
  }

  // (payload.type === 'TRANSFER')
  return {
    title,
    body: `You ${payload.expense.type} ${formattedMoney} for ${description}`,
  };
};

const handlePush = async (event: PushEvent) => {
  // TODO: move ZNotificationPayload to shared util and use it here to safeParse
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payload: NotificationPayload = event.data?.json();

  const { title, body } = getNotificationPresentation(payload);
  await self.registration.showNotification(title, {
    body,
  });
};

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});
