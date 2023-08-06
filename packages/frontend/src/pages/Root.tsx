import type { TRPCClientErrorLike } from '@trpc/client';
import type { UseTRPCQueryResult } from '@trpc/react-query/shared';
import type { AnyProcedure, AnyRouter } from '@trpc/server';
import type { TRPCErrorShape } from '@trpc/server/rpc';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  MdArrowBack,
  MdGroup,
  MdHome,
  MdSettings,
  MdTableView,
} from 'react-icons/md';
import { RiRefreshLine } from 'react-icons/ri';
import { NavLink, useNavigate } from 'react-router-dom';

import { usePullToRefresh } from '../api/usePullToRefresh';
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
    <div className="flex flex-col" style={{ height: '100dvh' }}>
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
          'flex flex-grow flex-col overflow-y-auto p-5',
          mainClassName,
        )}
      >
        {children}
      </main>
      {additionalChildren}

      <nav
        className="btm-nav flex-shrink-0 border-t-2 border-primary text-3xl text-primary"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) - 1em)',
          position: 'unset',
          top: 'unset',
          left: 'unset',
          right: 'unset',
        }}
      >
        <NavLink to="/" aria-label="Home" title="Home">
          <MdHome />
        </NavLink>

        <NavLink to="/sheets" aria-label="Sheets" title="Sheets">
          <MdTableView />
        </NavLink>

        <NavLink to="/groups" aria-label="Groups" title="Groups">
          <MdGroup />
        </NavLink>

        <NavLink to="/settings" aria-label="Settings" title="Settings">
          <MdSettings />
        </NavLink>
      </nav>
    </div>
  );
};

const ROOT_TOAST = 'root-toast';

export const RootLoader = <
  TData,
  TProcedure extends AnyProcedure | AnyRouter | TRPCErrorShape<number>,
>({
  result,
  render,
  title,
  getTitle,
  ...rootProps
}: Omit<RootProps, 'children' | 'title'> & {
  result: UseTRPCQueryResult<TData, TRPCClientErrorLike<TProcedure>>;
  render: (data: TData) => React.ReactNode;
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
          {result.status === 'success'
            ? getTitle?.(result.data) ?? title
            : title}
          {result.status === 'loading' && (
            <div className="loading loading-spinner loading-xs ml-4" />
          )}
          {!mobileStandalone && result.status !== 'loading' && onLine && (
            <Button className="btn-ghost" onClick={refetch}>
              <RiRefreshLine />
            </Button>
          )}
        </>
      }
      {...rootProps}
    >
      <AnimatePresence mode="wait">
        {result.status === 'error' && (
          <div className="alert alert-error">{result.error.message}</div>
        )}
        {result.status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {render(result.data)}
          </motion.div>
        )}
      </AnimatePresence>
    </Root>
  );
};
