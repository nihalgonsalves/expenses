import { useState } from 'react';
import { z } from 'zod';

import {
  getLightTheme,
  setLightTheme,
  getDarkTheme,
  setDarkTheme,
  syncThemeToHtml,
} from '../../utils/theme';
import { Select } from '../form/Select';

const lightThemes = [
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
].map((theme) => ({
  label: theme,
  value: theme,
}));

const darkThemes = [
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
].map((theme) => ({
  label: theme,
  value: theme,
}));

export const ThemeForm = () => {
  const [lightThemeState, setLightThemeState] = useState(getLightTheme());
  const [darkThemeState, setDarkThemeState] = useState(getDarkTheme());

  const changeLightTheme = (newTheme: string) => {
    setLightTheme(newTheme);
    setLightThemeState(getLightTheme());
    syncThemeToHtml();
  };

  const changeDarkTheme = (newTheme: string) => {
    setDarkTheme(newTheme);
    setDarkThemeState(getDarkTheme());
    syncThemeToHtml();
  };

  return (
    <div className="card-compact card card-bordered">
      <div className="card-body">
        <h2 className="card-title">Appearance</h2>
        <Select
          label="Light Theme"
          value={lightThemeState}
          setValue={changeLightTheme}
          options={lightThemes}
          schema={z.string()}
        />
        <Select
          label="Dark Theme"
          value={darkThemeState}
          setValue={changeDarkTheme}
          options={darkThemes}
          schema={z.string()}
        />
      </div>
    </div>
  );
};
