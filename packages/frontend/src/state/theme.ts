import { useEffect } from 'react';
import { z } from 'zod';

import { useMediaQuery } from '../utils/hooks/useMediaQuery';

import { createPreferenceWithDefault } from './preferences';

export const THEMES = [
  'blue',
  'slate',
  'rose',
  'orange',
  'green',
  'yellow',
  'violet',
] as const;

const THEME_DEFAULT = 'blue';

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

export const ZTheme = z.enum(THEMES);

type Theme = z.infer<typeof ZTheme>;

export const [useTheme] = createPreferenceWithDefault<Theme>(
  'theme',
  (v) => ZTheme.catch('blue').parse(v),
  THEME_DEFAULT,
);

const isDarkMode = (pref: ThemePreference) => {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return pref === 'dark';
};

const syncTheme = (themePreference: ThemePreference, theme: Theme) => {
  document.documentElement.setAttribute(
    'data-theme',
    `${theme}-${isDarkMode(themePreference) ? 'dark' : 'light'}`,
  );

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      'content',
      getComputedStyle(document.documentElement).getPropertyValue(
        '--theme-color',
      ),
    );
};

export const useThemeSync = () => {
  const [themePreference] = useThemePreference();
  const [theme] = useTheme();

  const systemDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncTheme(themePreference, theme);
  }, [themePreference, theme, systemDarkMode]);
};
