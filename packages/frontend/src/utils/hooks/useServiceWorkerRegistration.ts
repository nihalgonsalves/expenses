import { useQuery } from '@tanstack/react-query';

export const PUSH_SUPPORTED =
  'serviceWorker' in globalThis.navigator && 'PushManager' in globalThis.window;

export const useServiceWorkerRegistration = () => {
  const { data: serviceWorkerRegistration } = useQuery({
    queryKey: ['serviceWorkerRegistration'],
    queryFn: async () =>
      (await globalThis.navigator.serviceWorker.getRegistration()) ?? null,
    networkMode: 'always',
  });

  return serviceWorkerRegistration ?? undefined;
};
