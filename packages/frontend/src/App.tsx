import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { TrpcProvider } from './api/TrpcProvider';
import { OfflineToaster } from './components/OfflineToaster';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';
import { useMediaQuery } from './utils/hooks/useMediaQuery';
import { syncThemeToHtml } from './utils/theme';

void registerSW();

export const App = () => {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncThemeToHtml();
  }, [isDarkMode]);

  return (
    <TrpcProvider>
      <RouterProvider router={router} />
      <OfflineToaster />
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
