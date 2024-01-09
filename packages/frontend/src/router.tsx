import {
  createBrowserRouter,
  useParams as useParamsOriginal,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { z, type ZodRawShape } from "zod";

import { useCurrentUser } from "./api/useCurrentUser";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthenticationPage } from "./pages/AuthenticationPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SheetsIndexPage } from "./pages/SheetsIndexPage";
import { GroupDetailPage } from "./pages/groups/GroupDetailPage";
import { GroupTransactionsIndexPage } from "./pages/groups/transactions/GroupTransactionsIndexPage";
import { SheetDetailPage } from "./pages/sheets/SheetDetailPage";
import { SheetImportPage } from "./pages/sheets/SheetImportPage";
import { PersonalExpensesIndexPage } from "./pages/sheets/transactions/PersonalTransactionsIndexPage";
import { StatsIndexPage } from "./pages/stats/StatsIndexPage";
import { TransactionsIndexPage } from "./pages/transactions/TransactionsIndexPage";

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
    path: "/",
    element: (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    ),
    children: [
      {
        path: "/",
        element: (
          <AuthenticatedRoute>
            <TransactionsIndexPage />
          </AuthenticatedRoute>
        ),
      },
      {
        path: "/stats",
        element: (
          <AuthenticatedRoute>
            <StatsIndexPage />
          </AuthenticatedRoute>
        ),
      },
      {
        path: "/auth/sign-in",
        element: <AuthenticationPage />,
      },
      {
        path: "/auth/sign-up",
        element: <AuthenticationPage />,
      },
      {
        path: "/groups",
        children: [
          {
            path: "/groups",
            element: <Navigate to="/sheets" />,
          },
          {
            path: "/groups/:sheetId",
            children: [
              {
                path: "/groups/:sheetId",
                element: (
                  <AuthenticatedRoute>
                    <GroupDetailPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: "/groups/:sheetId/transactions",
                element: (
                  <AuthenticatedRoute>
                    <GroupTransactionsIndexPage />
                  </AuthenticatedRoute>
                ),
              },
            ],
          },
        ],
      },
      {
        path: "/sheets",
        children: [
          {
            path: "/sheets",
            element: (
              <AuthenticatedRoute>
                <SheetsIndexPage />
              </AuthenticatedRoute>
            ),
          },
          {
            path: "/sheets/:sheetId",
            children: [
              {
                path: "/sheets/:sheetId",
                element: (
                  <AuthenticatedRoute>
                    <SheetDetailPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: "/sheets/:sheetId/transactions",
                element: (
                  <AuthenticatedRoute>
                    <PersonalExpensesIndexPage />
                  </AuthenticatedRoute>
                ),
              },
              {
                path: "/sheets/:sheetId/import",
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
        path: "/settings",
        element: <SettingsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export const useParams = <T extends ZodRawShape>(schema: Zod.ZodObject<T>) => {
  const params = useParamsOriginal();
  return schema.parse(params);
};

export const SheetParams = z.object({ sheetId: z.string() });

export const TransactionParams = SheetParams.extend({
  transactionId: z.string(),
});

export { RouterProvider } from "react-router-dom";
