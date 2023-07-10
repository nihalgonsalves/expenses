import { ThemeProvider, createTheme } from '@mui/material/styles';

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
      <RouterProvider router={router} />
    </TrpcProvider>
  </ThemeProvider>
);
