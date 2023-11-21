import { useEffect } from 'react';
import { z } from 'zod';

import { useMediaQuery } from '../utils/hooks/useMediaQuery';

import { createPreferenceWithDefault } from './preferences';

// https://github.com/saadeghi/daisyui/blob/c3eed827ab4c3a5e5dec9363ac68be0b1ac5c6a3/src/theming/themes.js

export const LIGHT_THEMES = [
  'expenses-light',
  'light',
  'nord',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'retro',
  'cyberpunk',
  'valentine',
  'garden',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'cmyk',
  'autumn',
  'acid',
  'lemonade',
  'winter',
] as const;

export const DARK_THEMES = [
  'expenses-dark',
  'synthwave',
  'night',
  'dim',
  'sunset',
  'dark',
  'halloween',
  'forest',
  'aqua',
  'black',
  'luxury',
  'dracula',
  'business',
  'coffee',
] as const;

type LightTheme = (typeof LIGHT_THEMES)[number];
type DarkTheme = (typeof DARK_THEMES)[number];

const LIGHT_THEME_DEFAULT = 'expenses-light';
const DARK_THEME_DEFAULT = 'expenses-dark';

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

export const ZLightTheme = z.enum(LIGHT_THEMES);
export const ZDarkTheme = z.enum(DARK_THEMES);

export const [useLightTheme] = createPreferenceWithDefault<LightTheme>(
  'light_theme',
  (v) => ZLightTheme.catch(LIGHT_THEME_DEFAULT).parse(v),
  LIGHT_THEME_DEFAULT,
);

export const [useDarkTheme] = createPreferenceWithDefault<DarkTheme>(
  'light_theme',
  (v) => ZDarkTheme.catch(DARK_THEME_DEFAULT).parse(v),
  DARK_THEME_DEFAULT,
);

const isDarkMode = (pref: ThemePreference) => {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return pref === 'dark';
};

const themePrimaryColors: Record<LightTheme | DarkTheme, `#${string}`> = {
  'expenses-light': '#38bdf8',
  'expenses-dark': '#38bdf8',
  aqua: '#09ecf3',
  black: '#343232',
  bumblebee: '#f9d72f',
  cmyk: '#45AEEE',
  corporate: '#4b6bfb',
  cupcake: '#65c3c8',
  cyberpunk: '#ff7598',
  dark: '#661AE6',
  dracula: '#ff79c6',
  emerald: '#66cc8a',
  fantasy: '#6e0b75',
  forest: '#1eb854',
  garden: '#F40076',
  halloween: '#f28c18',
  light: '#570df8',
  lofi: '#0D0D0D',
  luxury: '#ffffff',
  pastel: '#d1c1d7',
  retro: '#ef9995',
  synthwave: '#e779c1',
  valentine: '#e96d7b',
  wireframe: '#b8b8b8',
  autumn: '#8C0327',
  business: '#1C4E80',
  acid: '#FF00F4',
  lemonade: '#519903',
  night: '#38bdf8',
  coffee: '#DB924B',
  winter: '#047AFF',
  dim: '#9FE88D',
  sunset: '#FF865B',
  nord: '#5E81AC',
};

const syncTheme = (
  themePreference: ThemePreference,
  darkTheme: DarkTheme,
  lightTheme: LightTheme,
) => {
  const theme = isDarkMode(themePreference) ? darkTheme : lightTheme;

  document.documentElement.setAttribute('data-theme', theme);

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', themePrimaryColors[theme]);
};

export const useThemeSync = () => {
  const [themePreference] = useThemePreference();
  const [lightTheme] = useLightTheme();
  const [darkTheme] = useDarkTheme();

  const systemDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    syncTheme(themePreference, darkTheme, lightTheme);
  }, [themePreference, lightTheme, darkTheme, systemDarkMode]);
};
