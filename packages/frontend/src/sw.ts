/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

import { type NotificationPayload } from '@nihalgonsalves/expenses-backend';

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

const handlePush = async (event: PushEvent) => {
  // TODO: move ZNotificationPayload to shared util and use it here to safeParse
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const payload: NotificationPayload = event.data?.json();

  if (payload.type === 'test') {
    await self.registration.showNotification('Test Notification', {
      body: payload.message,
    });
    return;
  }

  const description = getExpenseDescription(payload.expense);

  const formattedMoney = formatCurrency(payload.expense.money);

  const formattedBalance = formatCurrency(payload.expense.yourBalance, {
    signDisplay: 'never',
  });

  const negative = payload.expense.yourBalance.amount < 0;

  // Expense:
  //   💶 WG Expenses – Rent (€1,000.00)
  //   You owe €500.00 for Rent (€1,000.00)

  // Transfer:
  //   💶 WG Expenses – Transfer
  //   You sent €500.00

  const title =
    payload.expense.type === 'EXPENSE'
      ? `💶 ${payload.groupSheet.name} – ${description} (${formattedMoney})`
      : `💶 ${payload.groupSheet.name} – Transfer`;

  const body =
    payload.expense.type === 'EXPENSE'
      ? `${
          negative ? 'You receive' : 'You owe'
        } ${formattedBalance} for ${description} (${formattedMoney})`
      : `${negative ? 'You sent' : 'You received'} ${formattedBalance}`;

  await self.registration.showNotification(title, {
    body,
  });
};

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event));
});
