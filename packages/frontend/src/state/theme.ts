import { useCallback, useEffect } from 'react';
import { useMedia } from 'react-use';
import { z } from 'zod';

import {
  type Theme,
  THEME_DEFAULT,
  ZTheme,
} from '@nihalgonsalves/expenses-shared/types/theme';

import { trpc } from '../api/trpc';
import { useCurrentUser } from '../api/useCurrentUser';

import { createPreferenceWithDefault } from './preferences';

const ZThemePreference = z.enum(['system', 'light', 'dark']);

type ThemePreference = z.infer<typeof ZThemePreference>;

export const [useThemePreference] = createPreferenceWithDefault(
  'theme_preference',
  (v) => {
    const result = ZThemePreference.safeParse(v);
    return result.success ? result.data : 'system';
  },
  'system',
);

export const useTheme = () => {
  const utils = trpc.useUtils();

  const { data } = useCurrentUser();
  const { mutateAsync: updateTheme } = trpc.user.updateTheme.useMutation();

  const parsedTheme = ZTheme.safeParse(
    data?.theme ?? localStorage.getItem('theme'),
  );

  // cache preference locally to avoid flickering on load
  useEffect(() => {
    if (parsedTheme.success) {
      localStorage.setItem('theme', parsedTheme.data);
    }
  }, [parsedTheme]);

  const setTheme = useCallback(
    async (theme: Theme) => {
      await updateTheme(theme);
      await utils.user.me.invalidate();
    },
    [updateTheme, utils.user.me],
  );

  if (parsedTheme.success) {
    return [parsedTheme.data, setTheme] as const;
  }

  return [THEME_DEFAULT, setTheme] as const;
};

const isDarkMode = (pref: ThemePreference) => {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return pref === 'dark';
};

export const getThemeDataAttribute = (
  themePreference: ThemePreference,
  theme: Theme,
) => `${theme}-${isDarkMode(themePreference) ? 'dark' : 'light'}`;

export const syncMetaThemeColor = (shouldDarken = false) => {
  // this works because the first header is the one that touches the status bar
  // if there's a "last updated at" or "offline" banner, it will still be first
  // see Root.tsx

  const header = document.getElementsByTagName('header').item(0);

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

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    shouldDarken
      ? // the DrawerRoot is styled as bg-black/80, we can mimic the same 80% black effect by setting the RGB value to 20% of the original
        `rgb(${r * 0.2}, ${g * 0.2}, ${b * 0.2})`
      : backgroundColor,
  );
};

const syncTheme = (themePreference: ThemePreference, theme: Theme) => {
  document.documentElement.setAttribute(
    'data-theme',
    getThemeDataAttribute(themePreference, theme),
  );

  document
    .getElementById('rel-icon-png')
    ?.setAttribute('href', `/assets/icon-${theme}.png`);

  syncMetaThemeColor(false);
};

export const useThemeSync = () => {
  const [themePreference] = useThemePreference();
  const [theme] = useTheme();

  const systemDarkMode = useMedia('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncTheme(themePreference, theme);
  }, [themePreference, theme, systemDarkMode]);
};
