import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';

import { TrpcProvider } from './api/TrpcProvider';
import { RouterProvider, router } from './router';

const theme = createTheme({
  typography: {
    fontFamily: 'unset',
  },
});

export const App = () => (
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
