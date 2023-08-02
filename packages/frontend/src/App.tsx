import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { TrpcProvider } from './api/TrpcProvider';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';
import { useMediaQuery } from './utils/hooks';
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
      <Toaster
        toastOptions={{
          success: {
            style: {
              background: 'hsl(var(--su))',
              color: 'hsl(var(--suc) / var(--tw-text-opacity))',
            },
          },
          error: {
            style: {
              background: 'hsl(var(--er))',
              color: 'hsl(var(--erc) / var(--tw-text-opacity))',
            },
          },
        }}
      />
    </TrpcProvider>
  );
};
