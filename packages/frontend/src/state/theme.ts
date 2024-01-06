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
import { useNavigatorOnLine } from './useNavigatorOnLine';

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

const syncTheme = (
  themePreference: ThemePreference,
  theme: Theme,
  navigatorOnLine: boolean,
) => {
  document.documentElement.setAttribute(
    'data-theme',
    getThemeDataAttribute(themePreference, theme),
  );

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    `hsl(${getComputedStyle(document.documentElement).getPropertyValue(
      // see also: packages/frontend/src/pages/Root.tsx which adds a banner at the top
      // to blend with the theme colour
      navigatorOnLine ? '--primary' : '--muted',
    )})`,
  );

  document
    .getElementById('rel-icon-png')
    ?.setAttribute('href', `/assets/icon-${theme}.png`);
};

export const useThemeSync = () => {
  const [themePreference] = useThemePreference();
  const [theme] = useTheme();

  const navigatorOnLine = useNavigatorOnLine();

  const systemDarkMode = useMedia('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncTheme(themePreference, theme, navigatorOnLine ?? true);
  }, [themePreference, theme, navigatorOnLine, systemDarkMode]);
};
