import { ThemeProvider, createTheme } from '@mui/material/styles';

import { RouterProvider, router } from './router';

const theme = createTheme({
  typography: {
    fontFamily: 'unset',
  },
});

export const App = () => (
  <ThemeProvider theme={theme}>
    <RouterProvider router={router} />
  </ThemeProvider>
);
