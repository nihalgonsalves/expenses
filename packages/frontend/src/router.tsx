import { createBrowserRouter } from 'react-router-dom';
export { RouterProvider } from 'react-router-dom';

import { Index } from './pages/Index';
import { Root } from './pages/Root';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    // errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <Index />,
      },
    ],
  },
]);
