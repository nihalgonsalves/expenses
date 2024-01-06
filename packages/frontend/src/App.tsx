import emojiMartData from '@emoji-mart/data';
import { init as initEmojiMart } from 'emoji-mart';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

import { TrpcProvider } from './api/TrpcProvider';
import { useOffLineToaster } from './api/useOffLineToaster';
import { usePrefetchQueries } from './api/usePrefetchQueries';
import { registerSW, useSwUpdateCheck } from './registerSW';
import { RouterProvider, router } from './router';
import { useThemeSync } from './state/theme';

await registerSW();

// TODO: Use a react-query client instead of baked-in data
await initEmojiMart({ data: emojiMartData });

import.meta.hot?.accept(() => {
  void registerSW();
});

const GlobalHookContainer = () => {
  useSwUpdateCheck();
  useOffLineToaster();
  usePrefetchQueries();
  useThemeSync();

  return null;
};

export const App = () => (
  <TrpcProvider>
    <GlobalHookContainer />
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
    </MotionConfig>
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
