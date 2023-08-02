const LIGHT_THEME_KEY = 'lightTheme';
const DARK_THEME_KEY = 'darkTheme';

const LIGHT_THEME_DEFAULT = 'light';
const DARK_THEME_DEFAULT = 'synthwave';

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

// https://github.com/saadeghi/daisyui/blob/ab748bf7340ca89467e1be70c61c9169e8f7e7f5/src/theming/themes.js
const themePrimaryColors: Record<string, string> = {
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
  const themeName = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? getDarkTheme()
    : getLightTheme();

  document.documentElement.setAttribute('data-theme', themeName);

  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const themeColor = themePrimaryColors[themeName];
  if (themeColorMeta && themeColor) {
    themeColorMeta.setAttribute('content', themeColor);
  }
};
