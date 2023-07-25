/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { type NotificationPayload } from '@nihalgonsalves/expenses-backend';

import { categoryById } from './data/categories';
import { formatCurrency } from './utils/money';

declare let self: ServiceWorkerGlobalScope;

void self.skipWaiting();

clientsClaim();
cleanupOutdatedCaches();

if (!import.meta.env.DEV) {
  precacheAndRoute(self.__WB_MANIFEST);
  registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));
}

const handlePush = async (event: PushEvent) => {
  // TODO: move ZNotificationPayload to shared util and use it here to safeParse
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payload: NotificationPayload = event.data?.json();

  const description =
    (payload.expense.description ||
      categoryById[payload.expense.category]?.name) ??
    payload.expense.category;

  const formattedMoney = formatCurrency(payload.expense.money);

  const formattedBalance = formatCurrency(payload.expense.yourBalance, {
    signDisplay: 'never',
  });

  const negative = payload.expense.yourBalance.amount < 0;

  const title = `💶 ${payload.group.name} – ${description} ${formattedMoney}`;

  const body =
    payload.expense.type === 'EXPENSE'
      ? `${negative ? 'You receive' : 'You owe'} ${formattedBalance}`
      : `${negative ? 'You sent' : 'You received'} ${formattedBalance}`;

  await self.registration.showNotification(title, {
    body,
  });
};

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});
