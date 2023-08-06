import { useQuery } from '@tanstack/react-query';

import { useServiceWorkerRegistration } from './useServiceWorkerRegistration';

export const PUSH_SUPPORTED =
  'serviceWorker' in globalThis.navigator && 'PushManager' in globalThis.window;

export const usePushSubscription = () => {
  const serviceWorkerRegistration = useServiceWorkerRegistration();

  const { data: pushSubscription } = useQuery({
    queryKey: ['pushSubscription'],
    queryFn: async () =>
      (await serviceWorkerRegistration?.pushManager.getSubscription()) ?? null,
    enabled: serviceWorkerRegistration != null,
    networkMode: 'always',
    cacheTime: 0,
    staleTime: 0,
  });

  return pushSubscription ?? undefined;
};
