import { forwardRef } from 'react';
import { createBrowserRouter, Link, type LinkProps } from 'react-router-dom';

import { Expense } from './pages/Expense';
import { ExpensesIndex } from './pages/ExpensesIndex';
import { GroupDetail } from './pages/GroupDetail';
import { GroupsIndex } from './pages/GroupsIndex';
import { Index } from './pages/Index';
import { Root } from './pages/Root';

export const RouterLink = forwardRef<
  HTMLAnchorElement,
  { href: string } & Omit<LinkProps, 'to'>
>(({ href, ...props }, ref) => (
  <Link ref={ref} to={href} {...props} role={undefined} />
));
RouterLink.displayName = 'RouterLink';

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
      {
        path: 'groups',
        element: <GroupsIndex />,
      },
      {
        path: 'groups/:id',
        element: <GroupDetail />,
      },
      {
        path: 'expenses',
        element: <ExpensesIndex />,
      },
      {
        path: 'expenses/new',
        element: <Expense />,
      },
    ],
  },
]);

export { RouterProvider } from 'react-router-dom';
