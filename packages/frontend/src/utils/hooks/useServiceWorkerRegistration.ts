import { useQuery } from '@tanstack/react-query';

export const useServiceWorkerRegistration = () => {
  const { data: serviceWorkerRegistration } = useQuery({
    queryKey: ['serviceWorkerRegistration'],
    queryFn: async () => globalThis.navigator.serviceWorker.getRegistration(),
    enabled: 'serviceWorker' in globalThis.navigator,
    networkMode: 'always',
    cacheTime: 0,
    staleTime: 0,
  });

  return serviceWorkerRegistration;
};
