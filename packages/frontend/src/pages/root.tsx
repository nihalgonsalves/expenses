import { useInterval } from "@mantine/hooks";
import { AccessibleIcon } from "@radix-ui/react-accessible-icon";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";
import {
  ArrowLeftIcon,
  CogIcon,
  HomeIcon,
  ListIcon,
  PieChartIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { usePullToRefresh } from "../api/use-pull-to-refresh";
import { ErrorBoundary } from "../components/error-boundary";
import { NavBarAvatar } from "../components/nav-bar-avatar";
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
import { appConfigQueryOptions } from "../api/config.functions";
import { useNavigatorOnLine } from "../state/use-navigator-on-line";
import { useIsStandalone } from "../utils/hooks/use-is-standalone";
import {
  durationMilliseconds,
  formatDateTimeRelative,
  intervalGreaterThan,
} from "../utils/temporal";
import { haptics } from "bzzz";

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
    icon: <ListIcon className="size-5" />,
  },
  {
    to: "/stats",
    text: "Stats",
    icon: <PieChartIcon className="size-5" />,
  },
  {
    to: "/settings",
    text: "Settings",
    icon: <CogIcon className="size-5" />,
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
  const { data } = useQuery(appConfigQueryOptions());

  const router = useRouter();
  // see also: packages/frontend/src/state/theme.ts which marks the theme colour as muted when offline
  const navigatorOnLine = useNavigatorOnLine();

  return (
    <>
      <title>{data ? `${data.name} - ${title}` : title}</title>
      <div className="bg-background relative isolate m-auto flex h-dvh flex-col">
        {!navigatorOnLine || bannerText ? (
          <header className="bg-muted text-muted-foreground flex justify-center gap-1 p-1 text-center text-xs tracking-tighter">
            {bannerText ? <span>{bannerText}</span> : null}
            {!navigatorOnLine && <span>You are offline</span>}
          </header>
        ) : null}
        <header className="bg-primary flex place-items-center justify-center p-4 px-5 align-middle text-lg md:text-2xl">
          {showBackButton ? (
            <Button
              variant="ghost"
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
            viewportClassName={cn(
              "p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-5",
              className,
            )}
            rootClassName="flex grow flex-col"
          >
            {children}
          </ScrollArea>
        </main>

        {additionalChildren}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <nav className="mobile-glass-nav border-foreground/10 bg-background/20 pointer-events-auto relative flex h-16 overflow-hidden rounded-[1.75rem] border p-1.5 shadow-[0_12px_36px_rgb(0_0_0/0.18),inset_0_1px_0_rgb(255_255_255/0.35)] backdrop-blur-md backdrop-saturate-150 before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent">
            {navItems.map(({ to, text, icon }) => (
              <Link
                key={to}
                to={to}
                aria-label={text}
                title={text}
                className="text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative flex min-w-0 grow items-center justify-center rounded-[1.35rem] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                onClick={() => {
                  haptics.selection();
                }}
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.span
                        className="bg-primary/15 ring-primary/20 absolute inset-0 rounded-[1.35rem] shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_4px_14px_rgb(0_0_0/0.08)] ring-1"
                        layoutId="activeMobileNavItem"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.5,
                        }}
                      />
                    ) : null}
                    <motion.span
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        y: isActive ? -1 : 0,
                      }}
                      whileTap={{ scale: 0.88 }}
                      transition={{
                        type: "spring",
                        bounce: 0.25,
                        duration: 0.35,
                      }}
                      className={cn(
                        "relative z-10 flex size-11 items-center justify-center transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {icon}
                    </motion.span>
                  </>
                )}
              </Link>
            ))}
          </nav>
        </div>
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
    error: { message: string } | null;
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

  const refetch = () => {
    toast.promise(result.refetch(), {
      loading: "Refreshing",
      success: () => ({
        message: "Done",
        classNames: {
          icon: "text-primary",
          content: "w-full text-center",
        },
      }),
      error: () => ({
        message: "Error",
        classNames: {
          icon: "text-destructive",
          content: "w-full text-center",
        },
      }),
      id: ROOT_TOAST,
      classNames: {
        content: "w-full text-center",
      },
      style: {
        border: "none",
        backgroundColor: "var(--background)",
      },
    });
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
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={refetch}
            >
              <AccessibleIcon label="Refresh">
                <RefreshCcwIcon />
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
            <Alert variant="destructive">
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
