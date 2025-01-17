import loadable from "@loadable/component";
import {
  useParams as useParamsOriginal,
  Navigate,
  useLocation,
  Outlet,
  type RouteObject,
} from "react-router";
import { z, type ZodRawShape } from "zod";

import {
  RESET_PASSWORD_ROUTE,
  VERIFY_EMAIL_ROUTE,
} from "@nihalgonsalves/expenses-shared/routes";

import { useCurrentUser } from "./api/useCurrentUser";
import { ErrorBoundary } from "./components/ErrorBoundary";

const AuthenticationPage = loadable(
  async () => import("./pages/AuthenticationPage"),
);
const NotFoundPage = loadable(async () => import("./pages/NotFoundPage"));
const ResetPasswordPage = loadable(
  async () => import("./pages/ResetPasswordPage"),
);
const SettingsPage = loadable(async () => import("./pages/SettingsPage"));
const SheetsIndexPage = loadable(async () => import("./pages/SheetsIndexPage"));
const VerifyEmailPage = loadable(async () => import("./pages/VerifyEmailPage"));
const GroupDetailPage = loadable(
  async () => import("./pages/groups/GroupDetailPage"),
);
const SheetDetailPage = loadable(
  async () => import("./pages/sheets/SheetDetailPage"),
);
const SheetImportPage = loadable(
  async () => import("./pages/sheets/SheetImportPage"),
);
const StatsIndexPage = loadable(
  async () => import("./pages/stats/StatsIndexPage"),
);
const TransactionsIndexPage = loadable(
  async () => import("./pages/transactions/TransactionsIndexPage"),
);

const AuthenticatedRoute = ({
  children,
}: {
  children: React.ReactNode;
  // react 19 children can be promises, but we don't want an async component
  // eslint-disable-next-line @typescript-eslint/promise-function-async
}) => {
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

export const routes = [
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
        path: RESET_PASSWORD_ROUTE,
        element: <ResetPasswordPage />,
      },
      {
        path: VERIFY_EMAIL_ROUTE,
        element: <VerifyEmailPage />,
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
] satisfies RouteObject[];

export const useParams = <T extends ZodRawShape>(schema: Zod.ZodObject<T>) => {
  const params = useParamsOriginal();
  return schema.parse(params);
};

export const SheetParams = z.object({ sheetId: z.string() });

export { RouterProvider } from "react-router/dom";
