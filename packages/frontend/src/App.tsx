import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { TrpcProvider } from './api/TrpcProvider';
import { useOffLineToaster } from './api/useOffLineToaster';
import { usePrefetchQueries } from './api/usePrefetchQueries';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';
import { useHydrateState } from './state/useHydrateState';
import { useMediaQuery } from './utils/hooks/useMediaQuery';
import { syncThemeToHtml } from './utils/theme';

void registerSW();

const GlobalHookContainer = () => {
  useOffLineToaster();
  usePrefetchQueries();
  useHydrateState();
  return null;
};

export const App = () => {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncThemeToHtml();
  }, [isDarkMode]);

  return (
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
};
