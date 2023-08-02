import { forwardRef } from 'react';
import {
  createBrowserRouter,
  Link,
  type LinkProps,
  useParams as useParamsOriginal,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { z, type ZodRawShape } from 'zod';

import { trpc } from './api/trpc';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';
import { ExpensesIndexPage } from './pages/expenses/ExpensesIndexPage';
import { GroupDetailPage } from './pages/groups/GroupDetailPage';
import { GroupsIndexPage } from './pages/groups/GroupsIndexPage';
import { NewGroupPage } from './pages/groups/NewGroupPage';
import { GroupExpensesIndexPage } from './pages/groups/expenses/GroupExpensesIndexPage';
import { NewGroupSheetExpensePage } from './pages/groups/expenses/NewGroupSheetExpensePage';
import { NewSheetPage } from './pages/sheets/NewSheetPage';
import { SheetDetailPage } from './pages/sheets/SheetDetailPage';
import { SheetImportPage } from './pages/sheets/SheetImportPage';
import { SheetsIndexPage } from './pages/sheets/SheetsIndexPage';
import { NewPersonalSheetExpensePage } from './pages/sheets/expenses/NewExpensePage';
import { PersonalExpensesIndexPage } from './pages/sheets/expenses/PersonalExpensesIndexPage';

export const RouterLink = forwardRef<
  HTMLAnchorElement,
  { href: string } & Omit<LinkProps, 'to'>
>(({ href, ...props }, ref) => (
  <Link ref={ref} to={href} {...props} role={undefined} />
));
RouterLink.displayName = 'RouterLink';

const errorElement = <ErrorPage />;

const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const { error } = trpc.user.me.useQuery(undefined, {
    retry: false,
  });

  if (error?.data?.httpStatus === 401) {
    const searchParams = new URLSearchParams({
      redirect: location.pathname,
    });

    return <Navigate to={`/auth/sign-in?${searchParams.toString()}`} />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement,
    children: [
      {
        path: '/',
        element: (
          <AuthenticatedRoute>
            <ExpensesIndexPage />
          </AuthenticatedRoute>
        ),
        errorElement,
      },
      {
        path: '/auth/sign-in',
        element: <AuthenticationPage />,
        errorElement,
      },
      {
        path: '/auth/sign-up',
        element: <AuthenticationPage />,
        errorElement,
      },
      {
        path: '/groups',
        errorElement,
        children: [
          {
            path: '/groups',
            element: (
              <AuthenticatedRoute>
                <GroupsIndexPage />
              </AuthenticatedRoute>
            ),
          },
          {
            path: '/groups/new',
            element: (
              <AuthenticatedRoute>
                <NewGroupPage />
              </AuthenticatedRoute>
            ),
          },
          {
            path: '/groups/:groupSheetId',
            children: [
              {
                path: '/groups/:groupSheetId',
                element: (
                  <AuthenticatedRoute>
                    <GroupDetailPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: '/groups/:groupSheetId/expenses',
                element: (
                  <AuthenticatedRoute>
                    <GroupExpensesIndexPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: '/groups/:groupSheetId/expenses/new',
                element: (
                  <AuthenticatedRoute>
                    <NewGroupSheetExpensePage />
                  </AuthenticatedRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: '/sheets',
        errorElement,
        children: [
          {
            path: '/sheets',
            element: (
              <AuthenticatedRoute>
                <SheetsIndexPage />
              </AuthenticatedRoute>
            ),
          },
          {
            path: '/sheets/new',
            element: (
              <AuthenticatedRoute>
                <NewSheetPage />
              </AuthenticatedRoute>
            ),
          },
          {
            path: '/sheets/:sheetId',
            children: [
              {
                path: '/sheets/:sheetId',
                element: (
                  <AuthenticatedRoute>
                    <SheetDetailPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: '/sheets/:sheetId/expenses',
                element: (
                  <AuthenticatedRoute>
                    <PersonalExpensesIndexPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: '/sheets/:sheetId/expenses/new',
                element: (
                  <AuthenticatedRoute>
                    <NewPersonalSheetExpensePage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: '/sheets/:sheetId/import',
                element: (
                  <AuthenticatedRoute>
                    <SheetImportPage />
                  </AuthenticatedRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: '/settings',
        element: (
          <AuthenticatedRoute>
            <SettingsPage />
          </AuthenticatedRoute>
        ),
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

export const GroupParams = z.object({ groupSheetId: z.string() });

export const PersonalSheetParams = z.object({ sheetId: z.string() });

export { RouterProvider } from 'react-router-dom';
