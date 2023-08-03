import type { TRPCClientErrorLike } from '@trpc/client';
import type { UseTRPCQueryResult } from '@trpc/react-query/shared';
import type { AnyProcedure, AnyRouter } from '@trpc/server';
import type { TRPCErrorShape } from '@trpc/server/rpc';
import {
  MdArrowBack,
  MdGroup,
  MdHome,
  MdSettings,
  MdTableView,
} from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { NavBarAvatar } from '../components/NavBarAvatar';
import { clsxtw } from '../utils/utils';

type RootProps = {
  title: React.ReactNode;
  children: React.ReactNode;
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
          <button
            type="button"
            className="btn btn-ghost text-2xl"
            onClick={() => {
              navigate(-1);
            }}
          >
            <MdArrowBack />
          </button>
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
  if (result.status === 'loading') {
    return (
      <Root title={title} {...rootProps}>
        <LoadingSpinner />
      </Root>
    );
  }

  if (result.status === 'error') {
    return (
      <Root title="Error" {...rootProps}>
        <div className="alert alert-error">{result.error.message}</div>
      </Root>
    );
  }

  return (
    <Root title={getTitle?.(result.data) ?? title} {...rootProps}>
      {render(result.data)}
    </Root>
  );
};
