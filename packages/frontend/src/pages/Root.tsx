import { ArrowLeftIcon, SymbolIcon } from '@radix-ui/react-icons';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AnyProcedure, AnyRouter } from '@trpc/server';
import type { TRPCErrorShape } from '@trpc/server/rpc';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-hot-toast';
import {
  MdHome,
  MdPieChart,
  MdSettings,
  MdTableRows,
  MdOutlineHome,
  MdOutlinePieChart,
  MdOutlineSettings,
  MdOutlineTableRows,
} from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';

import { usePullToRefresh } from '../api/usePullToRefresh';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NavBarAvatar } from '../components/NavBarAvatar';
import { Button } from '../components/form/Button';
import { Alert, AlertTitle } from '../components/ui/alert';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../components/ui/navigation-menu';
import { useNavigatorOnLine } from '../state/useNavigatorOnLine';
import { useIsStandalone } from '../utils/hooks/useIsStandalone';
import { cn } from '../utils/utils';

type RootProps = {
  title: string | undefined;
  additionalTitleItems?: React.ReactNode;
  children?: React.ReactNode;
  rightNavBarItems?: React.ReactNode;
  showBackButton?: boolean;
  additionalChildren?: React.ReactNode;
};

const navItems = [
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
];

export const Root = ({
  title,
  additionalTitleItems,
  children,
  rightNavBarItems,
  showBackButton,
  additionalChildren,
}: RootProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="m-auto flex h-dvh flex-col">
        <header className="flex place-items-center justify-center bg-primary p-4 px-5 align-middle text-lg md:text-2xl">
          {showBackButton && (
            <Button
              variant="ghost"
              className="text-primary-foreground md:hidden"
              onClick={() => {
                navigate(-1);
              }}
            >
              <ArrowLeftIcon />
            </Button>
          )}

          <div className="ms-2 flex place-items-center font-semibold normal-case text-primary-foreground ">
            {title}
            {additionalTitleItems}
          </div>

          {rightNavBarItems}

          <div className="grow">&nbsp;</div>

          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              {navItems.map(({ to, text }) => (
                <NavigationMenuItem key={to}>
                  <NavLink to={to} aria-label={text} title={text}>
                    {({ isActive }) => (
                      <div
                        className={navigationMenuTriggerStyle({
                          className: cn(
                            'relative',
                            'bg-transparent',
                            'underline',
                            'hover:bg-inherit',
                            'hover:no-underline',
                            'hover:text-primary-foreground',
                            isActive
                              ? 'text-primary underline hover:text-primary'
                              : 'text-primary-foreground',
                          ),
                        })}
                      >
                        {text}
                        <motion.span
                          className={navigationMenuTriggerStyle({
                            className: cn(
                              'absolute',
                              'top-0',
                              'left-0',
                              '-z-10',
                              'text-transparent',
                              'hover:bg-transparent',
                              isActive
                                ? 'bg-primary-foreground'
                                : 'bg-transparent',
                            ),
                          })}
                          layoutId={isActive ? 'active' : to}
                          transition={{
                            type: 'spring',
                            bounce: 0.2,
                            duration: 0.5,
                          }}
                        >
                          {text}
                        </motion.span>
                      </div>
                    )}
                  </NavLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <NavBarAvatar className="ml-4" />
        </header>

        <main className="flex grow flex-col overflow-y-auto p-3 md:p-5">
          {children}
        </main>

        {additionalChildren}

        <nav
          className="flex shrink-0 border-t-2 border-primary text-3xl md:hidden"
          style={{}}
        >
          {navItems.map(({ to, text, activeIcon, icon }) => (
            <NavLink
              key={to}
              to={to}
              aria-label={text}
              title={text}
              className="flex grow flex-col"
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      className="h-1 bg-primary"
                      layoutId="activeLine"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  ) : (
                    <span className="h-1" />
                  )}
                  <motion.span
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.8 }}
                    className="flex grow justify-center p-4"
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
    </>
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
        title?: undefined;
        getTitle: (data: TData) => string;
      }
    | { title: string; getTitle?: undefined }
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
      title={result.data != null ? getTitle?.(result.data) ?? title : title}
      additionalTitleItems={
        <>
          {result.isLoading && <LoadingSpinner className="ml-4 size-4" />}
          {!mobileStandalone && !result.isLoading && onLine && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={refetch}
            >
              <SymbolIcon />
            </Button>
          )}
        </>
      }
      {...rootProps}
    >
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {result.error != null && (
            <Alert variant="destructive">
              <AlertTitle>{result.error.message}</AlertTitle>
            </Alert>
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
