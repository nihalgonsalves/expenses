import { useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';

import { TrpcProvider } from './api/TrpcProvider';
import { registerSW } from './registerSW';
import { RouterProvider, router } from './router';

void registerSW();

export const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = createTheme({
    typography: {
      fontFamily: 'unset',
    },
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
      primary: { main: '#DA0078' },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <TrpcProvider>
        <SnackbarProvider
          autoHideDuration={5000}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          <RouterProvider router={router} />
        </SnackbarProvider>
      </TrpcProvider>
    </ThemeProvider>
  );
};
