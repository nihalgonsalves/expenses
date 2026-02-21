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

import { useInvalidateRouter } from "#/api/useInvalidateRouter";

import { useTRPC } from "../api/trpc";
import { useCurrentUser } from "../api/useCurrentUser";
import { useDialog } from "../components/form/ResponsiveDialog";
import { isOldDataAtom } from "../pages/Root";

import { createPreferenceWithDefault } from "./preferences";
import { useNavigatorOnLine } from "./useNavigatorOnLine";

const ZThemePreference = z.enum(["system", "light", "dark"]);

type ThemePreference = z.infer<typeof ZThemePreference>;

export const useThemePreference = createPreferenceWithDefault(
  "theme_preference",
  (v) => {
    const result = ZThemePreference.safeParse(v);
    return result.success ? result.data : "system";
  },
  "system",
);

export const useTheme = () => {
  const { trpc } = useTRPC();
  const invalidateRouter = useInvalidateRouter();

  const me = useCurrentUser();
  const { mutateAsync: updateTheme } = useMutation(
    trpc.user.updateTheme.mutationOptions(),
  );

  const parsedTheme = ZTheme.safeParse(
    me?.theme ?? localStorage.getItem("theme"),
  );

  // cache preference locally to avoid flickering on load
  useEffect(() => {
    if (parsedTheme.success) {
      localStorage.setItem("theme", parsedTheme.data);
    }
  }, [parsedTheme]);

  const setTheme = async (theme: Theme) => {
    await updateTheme(theme);
    await invalidateRouter();
  };

  if (parsedTheme.success) {
    return [parsedTheme.data, setTheme] as const;
  }

  return [THEME_DEFAULT, setTheme] as const;
};

const isDarkMode = (pref: ThemePreference) => {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return pref === "dark";
};

export const getThemeDataAttribute = (
  themePreference: ThemePreference,
  theme: Theme,
) => `${theme}-${isDarkMode(themePreference) ? "dark" : "light"}`;

const setColor = (color: string) => {
  // Chrome PWA, Safari <=17
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", color);

  // Safari >=26, iOS >=26
  document
    .getElementsByTagName("body")
    .item(0)
    ?.style.setProperty("background-color", color);
};

const syncMetaThemeColor = (shouldDarken: boolean) => {
  // this works because the first header is the one that touches the status bar
  // if there's a "last updated at" or "offline" banner, it will still be first
  // see Root.tsx

  // fallback on load
  setColor(
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

  setColor(
    shouldDarken
      ? // the DrawerRoot is styled as bg-black/10, we can mimic the same 10% black effect
        // by setting the RGB value to 90% of the original
        `rgb(${r * 0.9}, ${g * 0.9}, ${b * 0.9})`
      : backgroundColor,
  );
};

const syncTheme = (themePreference: ThemePreference, theme: Theme) => {
  document.documentElement.setAttribute(
    "data-theme",
    getThemeDataAttribute(themePreference, theme),
  );
};

const syncColorScheme = (themePreference: ThemePreference) => {
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute("content", isDarkMode(themePreference) ? "dark" : "light");
};

export const useThemeSync = () => {
  const [themePreference] = useThemePreference();
  const [theme] = useTheme();
  const dialog = useDialog();
  const navigatorOnLine = useNavigatorOnLine();
  const isOldData = useAtomValue(isOldDataAtom);

  const systemDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    syncTheme(themePreference, theme);
    syncColorScheme(themePreference);
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
