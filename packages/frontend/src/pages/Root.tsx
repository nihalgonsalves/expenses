import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import {
  ArrowLeftIcon,
  GearIcon,
  HomeIcon,
  ListBulletIcon,
  PieChartIcon,
  SymbolIcon,
} from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import type { TRPCClientErrorLike } from "@trpc/client";
import { atom, useAtom } from "jotai";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { toast } from "react-hot-toast";
import { useInterval } from "react-use";

import { useTRPC } from "../api/trpc";
import { usePullToRefresh } from "../api/usePullToRefresh";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NavBarAvatar } from "../components/NavBarAvatar";
import { Alert, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "../components/ui/navigation-menu";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../components/ui/utils";
import { useNavigatorOnLine } from "../state/useNavigatorOnLine";
import { useIsStandalone } from "../utils/hooks/useIsStandalone";
import {
  durationMilliseconds,
  formatDateTimeRelative,
  intervalGreaterThan,
} from "../utils/temporal";

type RootProps = {
  title: string | undefined;
  additionalTitleItems?: ReactNode;
  children?: ReactNode;
  rightNavBarItems?: ReactNode;
  showBackButton?: boolean;
  additionalChildren?: ReactNode;
  className?: string;
  bannerText?: string | undefined;
};

const navItems = [
  {
    to: "/",
    text: "Home",
    icon: <HomeIcon className="size-5" />,
  },
  {
    to: "/sheets",
    text: "Sheets",
    icon: <ListBulletIcon className="size-5" />,
  },
  {
    to: "/stats",
    text: "Stats",
    icon: <PieChartIcon className="size-5" />,
  },
  {
    to: "/settings",
    text: "Settings",
    icon: <GearIcon className="size-5" />,
  },
];

export const isOldDataAtom = atom(false);

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
  const { trpc } = useTRPC();
  const { data } = useQuery(trpc.config.queryOptions());

  const router = useRouter();
  // see also: packages/frontend/src/state/theme.ts which marks the theme colour as muted when offline
  const navigatorOnLine = useNavigatorOnLine();

  return (
    <>
      <title>{data ? `${data.name} - ${title}` : title}</title>
      <div className="m-auto flex h-dvh flex-col">
        {!navigatorOnLine || bannerText ? (
          <header className="bg-muted text-muted-foreground flex justify-center gap-1 p-1 text-center text-xs tracking-tighter">
            {bannerText ? <span>{bannerText}</span> : null}
            {!navigatorOnLine && <span>You are offline</span>}
          </header>
        ) : null}
        <header className="bg-primary flex place-items-center justify-center p-4 px-5 align-middle text-lg md:text-2xl">
          {showBackButton ? (
            <Button
              $variant="ghost"
              className="text-primary-foreground md:hidden"
              onClick={() => {
                router.history.back();
              }}
            >
              <ArrowLeftIcon />
            </Button>
          ) : null}

          <div className="text-primary-foreground ms-2 flex place-items-center font-semibold normal-case">
            {title}
            {additionalTitleItems}
          </div>

          {rightNavBarItems}

          <div className="grow">&nbsp;</div>

          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              {navItems.map(({ to, text }) => (
                <NavigationMenuItem key={to}>
                  <Link to={to} aria-label={text} title={text}>
                    {({ isActive }) => (
                      <div
                        className={navigationMenuTriggerStyle({
                          className: cn(
                            "relative",
                            "bg-transparent",
                            "underline",
                            "hover:bg-inherit",
                            "hover:no-underline",
                            "hover:text-primary-foreground",
                            isActive
                              ? "text-primary hover:text-primary underline"
                              : "text-primary-foreground",
                          ),
                        })}
                      >
                        {text}
                        <motion.span
                          className={navigationMenuTriggerStyle({
                            className: cn(
                              "absolute",
                              "top-0",
                              "left-0",
                              "-z-10",
                              "text-transparent",
                              "hover:bg-transparent",
                              isActive
                                ? "bg-primary-foreground"
                                : "bg-transparent",
                            ),
                          })}
                          layoutId={isActive ? "active" : to}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                          }}
                        >
                          {text}
                        </motion.span>
                      </div>
                    )}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <NavBarAvatar className="ml-4" />
        </header>

        <main className="contents">
          <ScrollArea
            viewportClassName={cn("p-3 md:p-5", className)}
            rootClassName="flex grow flex-col"
          >
            {children}
          </ScrollArea>
        </main>

        {additionalChildren}

        <nav
          className="border-primary flex shrink-0 border-t-2 text-3xl md:hidden"
          style={{}}
        >
          {navItems.map(({ to, text, icon }) => (
            <Link
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
                      className="bg-primary h-1"
                      layoutId="activeLine"
                      transition={{
                        type: "spring",
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
                      paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                    }}
                  >
                    <span />
                    {icon}
                    <span />
                  </motion.span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

const ROOT_TOAST = "root-toast";

export const RootLoader = <TData,>({
  result,
  render,
  title,
  getTitle,
  ...rootProps
}: Omit<RootProps, "children" | "title" | "banner"> & {
  render: (data: TData) => ReactNode;
  result: {
    data: TData | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: TRPCClientErrorLike<any> | null;
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
  const shouldReduceMotion = useReducedMotion();

  const mobileStandalone = isStandalone && "ontouchstart" in window;

  const refetch = async () => {
    await toast.promise(
      result.refetch(),
      {
        loading: "Refreshing",
        success: "Done",
        error: "Error",
      },
      {
        id: ROOT_TOAST,
        className: "w-48",
        success: {
          duration: 1000,
        },
      },
    );
  };

  usePullToRefresh(ROOT_TOAST, refetch);

  // we use staleTime: 0 so we can't check react-query's isStale parameter to show a warning.
  // let's just show a warning if data hasn't been updated in a while, defined by us:
  const [isOldData, setIsOldData] = useAtom(isOldDataAtom);

  const dataUpdatedAt = Temporal.Instant.fromEpochMilliseconds(
    result.dataUpdatedAt,
  );

  useInterval(
    () => {
      setIsOldData(
        dataUpdatedAt.epochMilliseconds !== 0 &&
          intervalGreaterThan(
            Temporal.Now.instant(),
            dataUpdatedAt,
            Temporal.Duration.from({ minutes: 5 }),
          ),
      );
    },
    durationMilliseconds({ seconds: 3 }),
  );

  return (
    <Root
      title={result.data != null ? (getTitle?.(result.data) ?? title) : title}
      additionalTitleItems={
        <>
          {result.isLoading ? <LoadingSpinner className="ml-4 size-4" /> : null}
          {!mobileStandalone && !result.isLoading && onLine ? (
            <Button
              $variant="ghost"
              $size="icon"
              className="ml-2"
              onClick={refetch}
            >
              <AccessibleIcon label="Refresh">
                <SymbolIcon />
              </AccessibleIcon>
            </Button>
          ) : null}
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
              initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
            >
              {render(result.data)}
            </motion.div>
          )}
        </AnimatePresence>
      </ErrorBoundary>
    </Root>
  );
};
