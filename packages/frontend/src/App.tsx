import emojiMartData from '@emoji-mart/data';
import { init as initEmojiMart } from 'emoji-mart';
import { Toaster } from 'react-hot-toast';

import { TrpcProvider } from './api/TrpcProvider';
import { useOffLineToaster } from './api/useOffLineToaster';
import { usePrefetchQueries } from './api/usePrefetchQueries';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';
import { useThemeSync } from './state/theme';
import { useHydrateState } from './state/useHydrateState';

void registerSW();

// TODO: Use a react-query client instead of baked-in data
await initEmojiMart({ data: emojiMartData });

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
            primary: 'hsl(var(--primary))',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(var(--destructive))',
            secondary: '#ffffff',
          },
        },
      }}
    />
  </TrpcProvider>
);
