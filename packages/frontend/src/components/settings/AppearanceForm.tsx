import { MoonIcon, SunIcon, TargetIcon } from '@radix-ui/react-icons';

import { useSupportedCurrencies } from '../../api/currencyConversion';
import { usePreferredCurrencyCode } from '../../state/preferences';
import {
  LIGHT_THEMES,
  DARK_THEMES,
  useThemePreference,
  useDarkTheme,
  useLightTheme,
  ZLightTheme,
  ZDarkTheme,
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

  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

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
                  <SunIcon /> Light
                </>
              ),
            },
            {
              value: 'system',
              label: (
                <>
                  <TargetIcon /> System
                </>
              ),
            },
            {
              value: 'dark',
              label: (
                <>
                  <MoonIcon /> Dark
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
          schema={ZLightTheme}
        />
        <Select
          label="Dark Theme"
          value={darkTheme}
          setValue={setDarkTheme}
          options={darkThemeOptions}
          schema={ZDarkTheme}
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
