import { SnackbarProvider } from 'notistack';
import { useEffect } from 'react';

import { TrpcProvider } from './api/TrpcProvider';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';
import { useMediaQuery } from './utils/hooks';
import { syncThemeToHtml } from './utils/theme';

void registerSW();

// sync synchronously so that there's no FOUC
syncThemeToHtml();

export const App = () => {
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncThemeToHtml();
  }, [isDarkMode]);

  return (
    <TrpcProvider>
      <SnackbarProvider
        autoHideDuration={5000}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <RouterProvider router={router} />
      </SnackbarProvider>
    </TrpcProvider>
  );
};
