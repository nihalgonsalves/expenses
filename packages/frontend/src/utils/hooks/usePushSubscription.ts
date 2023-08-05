import { useQuery } from '@tanstack/react-query';

import { useServiceWorkerRegistration } from '../../state/useServiceWorkerRegistration';

export const usePushSubscription = () => {
  const serviceWorkerRegistration = useServiceWorkerRegistration();

  const { data: pushSubscription } = useQuery({
    queryKey: ['pushSubscription'],
    queryFn: async () =>
      (await serviceWorkerRegistration?.pushManager.getSubscription()) ?? null,
    enabled: serviceWorkerRegistration != null,
    networkMode: 'always',
    cacheTime: 0,
  });

  return pushSubscription ?? undefined;
};
