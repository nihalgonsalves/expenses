import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

export const PUSH_SUPPORTED =
  'serviceWorker' in globalThis.navigator && 'PushManager' in globalThis.window;

const serviceWorkerRegistration = atom<ServiceWorkerRegistration | null>(null);

export const useServiceWorkerRegistration = () => {
  const [swReg] = useAtom(serviceWorkerRegistration);
  return swReg;
};

export const useHydrateServiceWorkerRegistration = () => {
  const [, setSwReg] = useAtom(serviceWorkerRegistration);

  useEffect(() => {
    void (async () => {
      const registration = await navigator.serviceWorker.ready;

      setSwReg(registration);
    })();
  }, [setSwReg]);
};
