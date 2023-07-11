import { forwardRef } from 'react';
import {
  createBrowserRouter,
  Link,
  type LinkProps,
  useParams as useParamsOriginal,
} from 'react-router-dom';
import { z, type ZodRawShape } from 'zod';

import { ErrorPage } from './pages/ErrorPage';
import { ExpenseNew } from './pages/ExpenseNew';
import { ExpensesIndex } from './pages/ExpensesIndex';
import { GroupDetail } from './pages/GroupDetail';
import { GroupNew } from './pages/GroupNew';
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

const errorElement = <ErrorPage />;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement,
    children: [
      {
        path: '',
        element: <Index />,
        errorElement,
      },
      {
        path: 'groups',
        element: <GroupsIndex />,
        errorElement,
      },
      {
        path: 'groups/new',
        element: <GroupNew />,
        errorElement,
      },
      {
        path: 'groups/:groupId',
        element: <GroupDetail />,
        errorElement,
      },
      {
        path: 'groups/:groupId/expenses',
        element: <ExpensesIndex />,
        errorElement,
      },
      {
        path: 'groups/:groupId/expenses/new',
        element: <ExpenseNew />,
        errorElement,
      },
    ],
  },
]);

export const useParams = <T extends ZodRawShape>(schema: Zod.ZodObject<T>) => {
  const params = useParamsOriginal();
  return schema.parse(params);
};

export const GroupParams = z.object({ groupId: z.string() });

export { RouterProvider } from 'react-router-dom';