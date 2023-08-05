import { useHydrateNavigatorOnLine } from './useNavigatorOnLine';
import { useHydrateServiceWorkerRegistration } from './useServiceWorkerRegistration';

export const useHydrateState = () => {
  useHydrateNavigatorOnLine();
  useHydrateServiceWorkerRegistration();
};
