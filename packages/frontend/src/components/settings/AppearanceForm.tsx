import { MoonIcon, SunIcon, TargetIcon } from '@radix-ui/react-icons';

import { useSupportedCurrencies } from '../../api/currencyConversion';
import { usePreferredCurrencyCode } from '../../state/preferences';
import {
  THEMES,
  useThemePreference,
  ZTheme,
  useTheme,
} from '../../state/theme';
import { noop } from '../../utils/utils';
import { CurrencySelect } from '../form/CurrencySelect';
import { Select } from '../form/Select';
import { ToggleButtonGroup } from '../form/ToggleButtonGroup';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';

const themeOptions = THEMES.map((theme) => ({
  label: theme,
  value: theme,
}));

export const AppearanceForm = () => {
  const [themePreference, setThemePreference] = useThemePreference();

  const [theme, setTheme] = useTheme();

  const [preferredCurrencyCode, setPreferredCurrencyCode] =
    usePreferredCurrencyCode();

  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ToggleButtonGroup
          className="[&>button]:grow"
          options={[
            {
              value: 'light',
              label: (
                <>
                  <SunIcon className="mr-2" /> Light
                </>
              ),
            },
            {
              value: 'system',
              label: (
                <>
                  <TargetIcon className="mr-2" /> System
                </>
              ),
            },
            {
              value: 'dark',
              label: (
                <>
                  <MoonIcon className="mr-2" /> Dark
                </>
              ),
            },
          ]}
          value={themePreference}
          setValue={setThemePreference}
        />

        <Label className="flex flex-col gap-2">
          Theme
          <Select
            name="theme"
            onBlur={noop}
            placeholder="Theme"
            value={theme}
            onChange={setTheme}
            options={themeOptions}
            schema={ZTheme}
          />
        </Label>

        <Label className="flex flex-col gap-2">
          Preferred Display Currency
          <CurrencySelect
            name="Currency"
            onBlur={noop}
            options={supportedCurrencies}
            value={preferredCurrencyCode}
            onChange={setPreferredCurrencyCode}
          />
        </Label>
      </CardContent>
    </Card>
  );
};
