import { useCallback, useState } from 'react';
import { CgDarkMode } from 'react-icons/cg';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { z } from 'zod';

import {
  getLightTheme,
  setLightTheme,
  getDarkTheme,
  setDarkTheme,
  syncThemeToHtml,
  getThemePreference,
  type ThemePreference,
  LIGHT_THEMES,
  DARK_THEMES,
  setThemePreference,
} from '../../utils/theme';
import { Select } from '../form/Select';
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';

const lightThemeOptions = LIGHT_THEMES.map((theme) => ({
  label: theme,
  value: theme,
}));

const darkThemeOptions = DARK_THEMES.map((theme) => ({
  label: theme,
  value: theme,
}));

export const ThemeForm = () => {
  const [themePreferenceState, setThemePreferenceState] = useState(
    getThemePreference(),
  );
  const [lightThemeState, setLightThemeState] = useState(getLightTheme());
  const [darkThemeState, setDarkThemeState] = useState(getDarkTheme());

  const changeThemePreference = useCallback((value: ThemePreference) => {
    setThemePreference(value);
    setThemePreferenceState(value);
    syncThemeToHtml();
  }, []);

  const changeLightTheme = useCallback((value: string) => {
    setLightTheme(value);
    setLightThemeState(getLightTheme());
    syncThemeToHtml();
  }, []);

  const changeDarkTheme = useCallback((value: string) => {
    setDarkTheme(value);
    setDarkThemeState(getDarkTheme());
    syncThemeToHtml();
  }, []);

  return (
    <div className="card-compact card card-bordered">
      <div className="card-body">
        <h2 className="card-title">Appearance</h2>
        <ToggleButtonGroup
          options={[
            {
              value: 'light',
              label: (
                <>
                  <MdOutlineLightMode /> Light
                </>
              ),
            },
            {
              value: 'system',
              label: (
                <>
                  <CgDarkMode /> System
                </>
              ),
            },
            {
              value: 'dark',
              label: (
                <>
                  <MdOutlineDarkMode /> Dark
                </>
              ),
            },
          ]}
          value={themePreferenceState}
          setValue={changeThemePreference}
        />
        <Select
          label="Light Theme"
          value={lightThemeState}
          setValue={changeLightTheme}
          options={lightThemeOptions}
          schema={z.string()}
        />
        <Select
          label="Dark Theme"
          value={darkThemeState}
          setValue={changeDarkTheme}
          options={darkThemeOptions}
          schema={z.string()}
        />
      </div>
    </div>
  );
};
