import { forwardRef } from 'react';
import {
  createBrowserRouter,
  Link,
  type LinkProps,
  useParams as useParamsOriginal,
  Navigate,
} from 'react-router-dom';
import { z, type ZodRawShape } from 'zod';

import { trpc } from './api/trpc';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { ErrorPage } from './pages/ErrorPage';
import { ExpenseNew } from './pages/ExpenseNew';
import { ExpensesIndex } from './pages/ExpensesIndex';
import { GroupDetail } from './pages/GroupDetail';
import { GroupNew } from './pages/GroupNew';
import { GroupsIndex } from './pages/GroupsIndex';
import { NotFoundPage } from './pages/NotFoundPage';
import { Root } from './pages/Root';
import { SettingsPage } from './pages/SettingsPage';

export const RouterLink = forwardRef<
  HTMLAnchorElement,
  { href: string } & Omit<LinkProps, 'to'>
>(({ href, ...props }, ref) => (
  <Link ref={ref} to={href} {...props} role={undefined} />
));
RouterLink.displayName = 'RouterLink';

const errorElement = <ErrorPage />;

const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const { error } = trpc.user.me.useQuery(undefined, {
    retry: false,
  });

  if (error?.data?.httpStatus === 401) {
    return <Navigate to="/auth/sign-in" />;
  }

  return children;
};

// AuthenticatedRoute
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement,
    children: [
      {
        path: '',
        element: (
          <AuthenticatedRoute>
            <Navigate to="/groups" />
          </AuthenticatedRoute>
        ),
      },
      {
        path: 'auth/sign-in',
        element: <AuthenticationPage />,
        errorElement,
      },
      {
        path: 'auth/sign-up',
        element: <AuthenticationPage />,
        errorElement,
      },
      {
        path: 'groups',
        element: (
          <AuthenticatedRoute>
            <GroupsIndex />
          </AuthenticatedRoute>
        ),
        errorElement,
      },
      {
        path: 'groups/new',
        element: (
          <AuthenticatedRoute>
            <GroupNew />
          </AuthenticatedRoute>
        ),
        errorElement,
      },
      {
        path: 'groups/:groupId',
        element: (
          <AuthenticatedRoute>
            <GroupDetail />
          </AuthenticatedRoute>
        ),
        errorElement,
      },
      {
        path: 'groups/:groupId/expenses',
        element: (
          <AuthenticatedRoute>
            <ExpensesIndex />
          </AuthenticatedRoute>
        ),
        errorElement,
      },
      {
        path: 'groups/:groupId/expenses/new',
        element: (
          <AuthenticatedRoute>
            <ExpenseNew />
          </AuthenticatedRoute>
        ),
        errorElement,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
        errorElement,
      },
      {
        path: '*',
        element: <NotFoundPage />,
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
