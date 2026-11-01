import { useMediaQuery } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { z } from "zod";

import {
  type Theme,
  THEME_DEFAULT,
  ZTheme,
} from "@nihalgonsalves/expenses-shared/types/theme";

import { useInvalidateRouter } from "#/api/use-invalidate-router";

import { useCurrentUser, userApi } from "../api/user.functions";
import { useDialog } from "../components/form/responsive-dialog";
import { isOldDataAtom } from "../pages/root";

// loads the Temporal polyfill (see note in utils/temporal.ts)
import "../utils/temporal";

import { useNavigatorOnLine } from "./use-navigator-on-line";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { useRouteContext, useRouter } from "@tanstack/react-router";

const ZThemePreference = z.enum(["system", "light", "dark"]);

export type ThemePreference = z.infer<typeof ZThemePreference>;

const THEME_PREFERENCE_COOKIE = "theme_preference";
const THEME_PREFERENCE_COOKIE_MAX_AGE: Temporal.DurationLikeObject = {
  // max browser cookie lifetime
  days: 400,
};

const readThemePreferenceCookie = createIsomorphicFn()
  .server(async () => getCookie(THEME_PREFERENCE_COOKIE))
  .client(async () => (await cookieStore.get(THEME_PREFERENCE_COOKIE))?.value);

export const getThemePreference = async (): Promise<ThemePreference> =>
  ZThemePreference.catch("system").parse(await readThemePreferenceCookie());

export const getThemeModeAttribute = (pref: ThemePreference) =>
  pref === "system" ? undefined : pref;

export const useThemePreference = () => {
  const router = useRouter();
  const themePreference = useRouteContext({
    from: "__root__",
    select: (ctx) => ctx.themePreference,
  });

  const setThemePreference = async (value: ThemePreference) => {
    if (value === "system") {
      await cookieStore.delete(THEME_PREFERENCE_COOKIE);
    } else {
      await cookieStore.set({
        name: THEME_PREFERENCE_COOKIE,
        value,
        expires: Temporal.Now.zonedDateTimeISO().add(
          THEME_PREFERENCE_COOKIE_MAX_AGE,
        ).epochMilliseconds,
        // for cross-site navigations
        sameSite: "lax",
      });
    }
    await router.invalidate();
  };

  return [themePreference, setThemePreference] as const;
};

export const useTheme = () => {
  const invalidateRouter = useInvalidateRouter();

  const me = useCurrentUser();
  const { mutateAsync: updateTheme } = useMutation(
    userApi.theme.mutationOptions(),
  );

  const parsedTheme = ZTheme.safeParse(me?.theme);

  const setTheme = async (theme: Theme) => {
    await updateTheme(theme);
    await invalidateRouter();
  };

  if (parsedTheme.success) {
    return [parsedTheme.data, setTheme] as const;
  }

  return [THEME_DEFAULT, setTheme] as const;
};

const setMetaThemeColor = (color: string) => {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", color);
};

const syncMetaThemeColor = (shouldDarken: boolean) => {
  // this works because the first header is the one that touches the status bar
  // if there's a "last updated at" or "offline" banner, it will still be first
  // see Root.tsx

  // fallback on load
  setMetaThemeColor(
    window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--primary"),
  );

  const header = document.getElementsByTagName("header").item(0);
  if (!header) {
    return;
  }

  const { backgroundColor } = getComputedStyle(header);

  const result = z
    .tuple([z.coerce.number(), z.coerce.number(), z.coerce.number()])
    .safeParse(backgroundColor.match(/\d+/g));

  if (!result.success) {
    return;
  }

  const [r, g, b] = result.data;

  setMetaThemeColor(
    shouldDarken
      ? // the DrawerRoot is styled as bg-black/10, we can mimic the same 10% black effect
        // by setting the RGB value to 90% of the original
        `rgb(${r * 0.9}, ${g * 0.9}, ${b * 0.9})`
      : backgroundColor,
  );
};

/** Re-render with the new mode when another tab changes the preference */
const useThemePreferenceCrossTabSync = () => {
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    cookieStore.addEventListener(
      "change",
      ({ changed, deleted }) => {
        if (
          [...changed, ...deleted].some(
            (c) => c.name === THEME_PREFERENCE_COOKIE,
          )
        ) {
          void router.invalidate();
        }
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, [router]);
};

export const useThemeSync = () => {
  useThemePreferenceCrossTabSync();

  const [themePreference] = useThemePreference();
  const [theme] = useTheme();
  const dialog = useDialog();
  const navigatorOnLine = useNavigatorOnLine();
  const isOldData = useAtomValue(isOldDataAtom);

  const systemDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    syncMetaThemeColor(dialog.isOpen);
  }, [
    themePreference,
    theme,
    systemDarkMode,
    dialog.isOpen,
    navigatorOnLine,
    isOldData,
  ]);
};
