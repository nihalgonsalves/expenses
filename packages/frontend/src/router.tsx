import { forwardRef } from 'react';
import {
  createBrowserRouter,
  Link,
  type LinkProps,
  useParams as useParamsOriginal,
} from 'react-router-dom';
import { z, type ZodRawShape } from 'zod';

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
        path: 'groups/new',
        element: <GroupNew />,
      },
      {
        path: 'groups/:groupId',
        element: <GroupDetail />,
      },
      {
        path: 'groups/:groupId/expenses',
        element: <ExpensesIndex />,
      },
      {
        path: 'groups/:groupId/expenses/new',
        element: <ExpenseNew />,
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
