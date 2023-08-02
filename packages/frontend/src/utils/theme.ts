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

export const syncThemeToHtml = () => {
  document.documentElement.setAttribute(
    'data-theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? getDarkTheme()
      : getLightTheme(),
  );
};
