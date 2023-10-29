import {
  createBrowserRouter,
  useParams as useParamsOriginal,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { z, type ZodRawShape } from 'zod';

import { useCurrentUser } from './api/useCurrentUser';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthenticationPage } from './pages/AuthenticationPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SettingsPage } from './pages/SettingsPage';
import { SheetsIndexPage } from './pages/SheetsIndexPage';
import { ExpensesIndexPage } from './pages/expenses/ExpensesIndexPage';
import { GroupDetailPage } from './pages/groups/GroupDetailPage';
import { GroupExpensesIndexPage } from './pages/groups/expenses/GroupExpensesIndexPage';
import { NewGroupSheetExpensePage } from './pages/groups/expenses/NewGroupSheetExpensePage';
import { NewSheetPage } from './pages/sheets/NewSheetPage';
import { SheetDetailPage } from './pages/sheets/SheetDetailPage';
import { SheetImportPage } from './pages/sheets/SheetImportPage';
import { NewPersonalSheetExpensePage } from './pages/sheets/expenses/NewExpensePage';
import { PersonalExpensesIndexPage } from './pages/sheets/expenses/PersonalExpensesIndexPage';
import { StatsIndexPage } from './pages/stats/StatsIndexPage';

const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const { error } = useCurrentUser();

  if (error?.data?.httpStatus === 401) {
    const searchParams = new URLSearchParams({
      redirect: location.pathname,
    });

    return <Navigate to={`/auth/sign-in?${searchParams.toString()}`} replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    ),
    children: [
      {
        path: '/',
        element: (
          <AuthenticatedRoute>
            <ExpensesIndexPage />
          </AuthenticatedRoute>
        ),
      },
      {
        path: '/stats',
        element: (
          <AuthenticatedRoute>
            <StatsIndexPage />
          </AuthenticatedRoute>
        ),
      },
      {
        path: '/auth/sign-in',
        element: <AuthenticationPage />,
      },
      {
        path: '/auth/sign-up',
        element: <AuthenticationPage />,
      },
      {
        path: '/groups',
        children: [
          {
            path: '/groups',
            element: <Navigate to="/sheets" />,
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
        element: <SettingsPage />,
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
