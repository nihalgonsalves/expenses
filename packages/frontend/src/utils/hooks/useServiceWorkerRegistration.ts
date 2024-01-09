import { useQuery } from "@tanstack/react-query";

export const useServiceWorkerRegistration = () => {
  const { data: serviceWorkerRegistration } = useQuery({
    queryKey: ["serviceWorkerRegistration"],
    queryFn: async () =>
      (await globalThis.navigator.serviceWorker.getRegistration()) ?? null,
    enabled: "serviceWorker" in globalThis.navigator,
    networkMode: "always",
    cacheTime: 0,
    staleTime: 0,
  });

  return serviceWorkerRegistration;
};
