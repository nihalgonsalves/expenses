import { Temporal } from '@js-temporal/polyfill';
import {
  ArrowLeftIcon,
  GearIcon,
  HomeIcon,
  ListBulletIcon,
  PieChartIcon,
  SymbolIcon,
} from '@radix-ui/react-icons';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AnyProcedure, AnyRouter } from '@trpc/server';
import type { TRPCErrorShape } from '@trpc/server/rpc';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet';
import { toast } from 'react-hot-toast';
import { NavLink, useNavigate } from 'react-router-dom';
import { useInterval } from 'react-use';

import { usePullToRefresh } from '../api/usePullToRefresh';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { NavBarAvatar } from '../components/NavBarAvatar';
import { Alert, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../components/ui/navigation-menu';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../components/ui/utils';
import { useNavigatorOnLine } from '../state/useNavigatorOnLine';
import { useIsStandalone } from '../utils/hooks/useIsStandalone';
import { formatDateTimeRelative, intervalGreaterThan } from '../utils/temporal';

type RootProps = {
  title: string | undefined;
  additionalTitleItems?: React.ReactNode;
  children?: React.ReactNode;
  rightNavBarItems?: React.ReactNode;
  showBackButton?: boolean;
  additionalChildren?: React.ReactNode;
  className?: string;
  bannerText?: string | undefined;
};

const navItems = [
  {
    to: '/',
    text: 'Home',
    icon: <HomeIcon className="size-5" />,
  },
  {
    to: '/sheets',
    text: 'Sheets',
    icon: <ListBulletIcon className="size-5" />,
  },
  {
    to: '/stats',
    text: 'Stats',
    icon: <PieChartIcon className="size-5" />,
  },
  {
    to: '/settings',
    text: 'Settings',
    icon: <GearIcon className="size-5" />,
  },
];

export const Root = ({
  title,
  additionalTitleItems,
  children,
  rightNavBarItems,
  showBackButton,
  additionalChildren,
  className,
  bannerText,
}: RootProps) => {
  const navigate = useNavigate();
  // see also: packages/frontend/src/state/theme.ts which marks the theme colour as muted when offline
  const navigatorOnLine = useNavigatorOnLine();

  return (
    <>
      <Helmet>
        <title>{`Expenses - ${title}`}</title>
      </Helmet>
      <div className="m-auto flex h-dvh flex-col">
        {(!navigatorOnLine || bannerText) && (
          <div className="flex justify-center gap-1 bg-muted p-1 text-center text-xs tracking-tighter text-muted-foreground">
            {bannerText && <span>{bannerText}</span>}
            {!navigatorOnLine && <span>You are offline</span>}
          </div>
        )}
        <header className="flex place-items-center justify-center bg-primary p-4 px-5 align-middle text-lg md:text-2xl">
          {showBackButton && (
            <Button
              $variant="ghost"
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

        <ScrollArea
          viewportClassName={cn('p-3 md:p-5', className)}
          rootClassName="flex grow flex-col"
        >
          <main>{children}</main>
        </ScrollArea>

        {additionalChildren}

        <nav
          className="flex shrink-0 border-t-2 border-primary text-3xl md:hidden"
          style={{}}
        >
          {navItems.map(({ to, text, icon }) => (
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
                    className="flex grow justify-center p-4"
                    style={{
                      paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                    }}
                  >
                    <span />
                    {icon}
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
}: Omit<RootProps, 'children' | 'title' | 'banner'> & {
  render: (data: TData) => React.ReactNode;
  result: {
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    refetch: () => Promise<unknown>;
    dataUpdatedAt: number;
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

  // we use staleTime: 0 so we can't check react-query's isStale parameter to show a warning.
  // let's just show a warning if data hasn't been updated in a while, defined by us:
  const [isOldData, setIsOldData] = useState(false);

  const dataUpdatedAt = Temporal.Instant.fromEpochMilliseconds(
    result.dataUpdatedAt,
  );

  useInterval(() => {
    setIsOldData(
      dataUpdatedAt.epochMilliseconds !== 0 &&
        intervalGreaterThan(
          Temporal.Now.instant(),
          dataUpdatedAt,
          Temporal.Duration.from({ minutes: 1 }),
        ),
    );
  });

  return (
    <Root
      title={result.data != null ? getTitle?.(result.data) ?? title : title}
      additionalTitleItems={
        <>
          {result.isLoading && <LoadingSpinner className="ml-4 size-4" />}
          {!mobileStandalone && !result.isLoading && onLine && (
            <Button
              $variant="ghost"
              $size="icon"
              className="ml-2"
              onClick={refetch}
            >
              <SymbolIcon />
            </Button>
          )}
        </>
      }
      bannerText={
        isOldData
          ? `Last updated ${formatDateTimeRelative(dataUpdatedAt)}.`
          : undefined
      }
      {...rootProps}
    >
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          {result.error != null && (
            <Alert $variant="destructive">
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
