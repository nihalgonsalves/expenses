import { z } from 'zod';

// https://github.com/saadeghi/daisyui/blob/ab748bf7340ca89467e1be70c61c9169e8f7e7f5/src/theming/themes.js

export const LIGHT_THEMES = [
  'expenses-light',
  'light',
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

const THEME_PREFERENCE_KEY = 'themePreference';

const LIGHT_THEME_KEY = 'lightTheme';
const DARK_THEME_KEY = 'darkTheme';

const LIGHT_THEME_DEFAULT = 'expenses-light';
const DARK_THEME_DEFAULT = 'expenses-dark';

const ZThemePreference = z.union([
  z.literal('system'),
  z.literal('light'),
  z.literal('dark'),
]);

export type ThemePreference = z.infer<typeof ZThemePreference>;

export const getThemePreference = (): ThemePreference => {
  const rawValue = localStorage.getItem(THEME_PREFERENCE_KEY);
  const result = ZThemePreference.safeParse(rawValue);

  return result.success ? result.data : 'system';
};

export const setThemePreference = (preference: ThemePreference) => {
  localStorage.setItem(THEME_PREFERENCE_KEY, preference);
};

export const getLightTheme = () =>
  localStorage.getItem(LIGHT_THEME_KEY) ?? LIGHT_THEME_DEFAULT;

export const getDarkTheme = () =>
  localStorage.getItem(DARK_THEME_KEY) ?? DARK_THEME_DEFAULT;

export const setLightTheme = (theme: string) => {
  localStorage.setItem(LIGHT_THEME_KEY, theme);
};

export const setDarkTheme = (theme: string) => {
  localStorage.setItem(DARK_THEME_KEY, theme);
};

const isDarkMode = () => {
  const pref = getThemePreference();

  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return pref === 'dark';
};

const themePrimaryColors: Record<string, string> = {
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
};

export const syncThemeToHtml = () => {
  const themeName = isDarkMode() ? getDarkTheme() : getLightTheme();

  document.documentElement.setAttribute('data-theme', themeName);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const themeColor = themePrimaryColors[themeName];
  if (themeColorMeta && themeColor) {
    themeColorMeta.setAttribute('content', themeColor);
  }
};
