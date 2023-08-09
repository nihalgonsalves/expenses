import type { TRPCClientErrorLike } from '@trpc/client';
import type { AnyProcedure, AnyRouter } from '@trpc/server';
import type { TRPCErrorShape } from '@trpc/server/rpc';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdHome,
  MdPieChart,
  MdSettings,
  MdTableRows,
  MdOutlineHome,
  MdOutlinePieChart,
  MdOutlineSettings,
  MdOutlineTableRows,
} from 'react-icons/md';
import { RiRefreshLine } from 'react-icons/ri';
import { NavLink, useNavigate } from 'react-router-dom';

import { usePullToRefresh } from '../api/usePullToRefresh';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NavBarAvatar } from '../components/NavBarAvatar';
import { Button } from '../components/form/Button';
import { useNavigatorOnLine } from '../state/useNavigatorOnLine';
import { useIsStandalone } from '../utils/hooks/useIsStandalone';
import { clsxtw } from '../utils/utils';

type RootProps = {
  title: React.ReactNode;
  children?: React.ReactNode;
  showBackButton?: boolean;
  mainClassName?: string;
  additionalChildren?: React.ReactNode;
};

export const Root = ({
  title,
  children,
  showBackButton,
  mainClassName,
  additionalChildren,
}: RootProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-base-100 max-w-screen-2xl h-[100dvh] m-auto">
      <header className="navbar bg-primary text-primary-content">
        {showBackButton && (
          <Button
            className="btn-ghost text-2xl"
            onClick={() => {
              navigate(-1);
            }}
          >
            <MdArrowBack />
          </Button>
        )}

        <div className="ms-2 flex-grow text-2xl font-semibold normal-case">
          {title}
        </div>

        <NavBarAvatar />
      </header>

      <main
        className={clsxtw(
          'flex flex-grow flex-col overflow-y-auto p-3 md:p-5',
          mainClassName,
        )}
      >
        {children}
      </main>
      {additionalChildren}

      <nav
        className="flex-shrink-0 border-t-2 border-primary flex text-3xl"
        style={{}}
      >
        {[
          {
            to: '/',
            text: 'Home',
            activeIcon: <MdHome />,
            icon: <MdOutlineHome />,
          },
          {
            to: '/sheets',
            text: 'Sheets',
            activeIcon: <MdTableRows />,
            icon: <MdOutlineTableRows />,
          },
          {
            to: '/stats',
            text: 'Stats',
            activeIcon: <MdPieChart />,
            icon: <MdOutlinePieChart />,
          },
          {
            to: '/settings',
            text: 'Settings',
            activeIcon: <MdSettings />,
            icon: <MdOutlineSettings />,
          },
        ].map(({ to, text, activeIcon, icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={text}
            title={text}
            className="flex-grow flex flex-col"
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <motion.span
                    className="bg-primary h-1"
                    layoutId="activeLine"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                ) : (
                  <span className="h-1" />
                )}
                <motion.span
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.8 }}
                  className="flex flex-grow justify-center p-4"
                  style={{
                    paddingBottom:
                      'max(1rem, calc(env(safe-area-inset-bottom) - 1rem))',
                  }}
                >
                  <span />
                  {isActive ? activeIcon : icon}
                  <span />
                </motion.span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

const ROOT_TOAST = 'root-toast';

export const RootLoader = <
  TData,
  TError extends TRPCClientErrorLike<
    AnyProcedure | AnyRouter | TRPCErrorShape<number>
  >,
>({
  result,
  render,
  title,
  getTitle,
  ...rootProps
}: Omit<RootProps, 'children' | 'title'> & {
  render: (data: TData) => React.ReactNode;
  result: {
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    refetch: () => Promise<unknown>;
  };
} & (
    | {
        title?: React.ReactNode;
        getTitle: (data: TData) => React.ReactNode;
      }
    | { title: React.ReactNode; getTitle?: undefined }
  )) => {
  const onLine = useNavigatorOnLine();
  const isStandalone = useIsStandalone();

  const mobileStandalone = isStandalone && 'ontouchstart' in window;

  const refetch = useCallback(async () => {
    await toast.promise(
      result.refetch(),
      {
        loading: 'Refreshing',
        success: 'Done',
        error: 'Error',
      },
      {
        id: ROOT_TOAST,
        className: 'w-48',
        success: {
          duration: 1000,
        },
      },
    );
  }, [result]);

  usePullToRefresh(ROOT_TOAST, refetch);

  return (
    <Root
      title={
        <>
          {result.data != null ? getTitle?.(result.data) ?? title : title}
          {result.isLoading && (
            <div className="loading loading-spinner loading-xs ml-4" />
          )}
          {!mobileStandalone && !result.isLoading && onLine && (
            <Button className="btn-ghost" onClick={refetch}>
              <RiRefreshLine />
            </Button>
          )}
        </>
      }
      {...rootProps}
    >
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {result.error != null && (
            <div className="alert alert-error">{result.error.message}</div>
          )}
          {result.data != null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {render(result.data)}
            </motion.div>
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </Root>
  );
};
