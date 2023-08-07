import { Toaster } from 'react-hot-toast';

import { TrpcProvider } from './api/TrpcProvider';
import { useOffLineToaster } from './api/useOffLineToaster';
import { usePrefetchQueries } from './api/usePrefetchQueries';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';
import { useThemeSync } from './state/theme';
import { useHydrateState } from './state/useHydrateState';

void registerSW();

const GlobalHookContainer = () => {
  useOffLineToaster();
  usePrefetchQueries();
  useHydrateState();
  useThemeSync();

  return null;
};

export const App = () => (
  <TrpcProvider>
    <GlobalHookContainer />
    <RouterProvider router={router} />
    <Toaster
      toastOptions={{
        success: {
          iconTheme: {
            primary: 'hsl(var(--su))',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(var(--er))',
            secondary: '#ffffff',
          },
        },
      }}
    />
  </TrpcProvider>
);
