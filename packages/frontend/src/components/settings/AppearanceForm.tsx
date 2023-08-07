import { CgDarkMode } from 'react-icons/cg';
import { MdOutlineDarkMode, MdOutlineLightMode } from 'react-icons/md';
import { z } from 'zod';

import { trpc } from '../../api/trpc';
import { usePreferredCurrencyCode } from '../../state/preferences';
import {
  LIGHT_THEMES,
  DARK_THEMES,
  useThemePreference,
  useDarkTheme,
  useLightTheme,
} from '../../state/theme';
import { CurrencySelect } from '../form/CurrencySelect';
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

export const AppearanceForm = () => {
  const [themePreference, setThemePreference] = useThemePreference();

  const [lightTheme, setLightTheme] = useLightTheme();
  const [darkTheme, setDarkTheme] = useDarkTheme();

  const [preferredCurrencyCode, setPreferredCurrencyCode] =
    usePreferredCurrencyCode();

  const { data: supportedCurrencies = [] } =
    trpc.currencyConversion.getSupportedCurrencies.useQuery();

  return (
    <section className="card card-bordered card-compact">
      <div className="card-body flex flex-col gap-4">
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
          value={themePreference}
          setValue={setThemePreference}
        />
        <Select
          label="Light Theme"
          value={lightTheme}
          setValue={setLightTheme}
          options={lightThemeOptions}
          schema={z.string()}
        />
        <Select
          label="Dark Theme"
          value={darkTheme}
          setValue={setDarkTheme}
          options={darkThemeOptions}
          schema={z.string()}
        />

        <CurrencySelect
          label="Preferred display currency"
          options={supportedCurrencies}
          currencyCode={preferredCurrencyCode}
          setCurrencyCode={setPreferredCurrencyCode}
        />
      </div>
    </section>
  );
};
