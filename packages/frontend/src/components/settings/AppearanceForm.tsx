import {
  CheckIcon,
  MoonIcon,
  SunIcon,
  TargetIcon,
} from "@radix-ui/react-icons";

import {
  type Theme,
  THEMES,
} from "@nihalgonsalves/expenses-shared/types/theme";

import { useSupportedCurrencies } from "../../api/currencyConversion";
import { usePreferredCurrencyCode } from "../../state/preferences";
import {
  useThemePreference,
  useTheme,
  getThemeDataAttribute,
} from "../../state/theme";
import { useIsStandalone } from "../../utils/hooks/useIsStandalone";
import { noop } from "../../utils/utils";
import { CurrencySelect } from "../form/CurrencySelect";
import { ToggleButtonGroup } from "../form/ToggleButtonGroup";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

import { IconPreview } from "./IconPreview";

export const AppearanceForm = () => {
  const [themePreference, setThemePreference] = useThemePreference();

  const isStandalone = useIsStandalone();

  const [theme, setTheme] = useTheme();

  const [preferredCurrencyCode, setPreferredCurrencyCode] =
    usePreferredCurrencyCode();

  const { data: supportedCurrencies = [] } = useSupportedCurrencies();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="flex grow flex-col gap-4">
        <ToggleButtonGroup
          className="[&>button]:grow"
          options={[
            {
              value: "light",
              label: (
                <>
                  <SunIcon className="mr-2" /> Light
                </>
              ),
            },
            {
              value: "system",
              label: (
                <>
                  <TargetIcon className="mr-2" /> System
                </>
              ),
            },
            {
              value: "dark",
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
          <ToggleGroup
            type="single"
            variant="outline"
            value={theme}
            onValueChange={(newVal) => {
              // https://www.radix-ui.com/primitives/docs/components/toggle-group#ensuring-there-is-always-a-value
              if (newVal) {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                void setTheme(newVal as Theme);
              }
            }}
          >
            {THEMES.map((t) => (
              <ToggleGroupItem
                key={t}
                value={t}
                data-theme={getThemeDataAttribute(themePreference, t)}
                className="data-[state=on]:border-primary grid size-9 place-items-center rounded-full border shadow-none"
              >
                <span className="bg-primary text-primary-foreground grid size-6 place-items-center rounded-full">
                  {theme === t && <CheckIcon />}
                </span>
                <span className="sr-only">{t}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Label>

        <Label className="flex flex-col gap-2">
          Preferred Display Currency
          <CurrencySelect
            name="Currency"
            onBlur={noop}
            options={supportedCurrencies}
            value={preferredCurrencyCode}
            onChange={(newCode) => {
              void setPreferredCurrencyCode(newCode ?? undefined);
            }}
          />
        </Label>

        <IconPreview theme={theme} />

        <div className="text-center text-xs">
          {isStandalone ? (
            <>
              An installed app icon cannot be changed, please delete and re-add
              the web app.
            </>
          ) : (
            <>
              If you change your theme, reload the page before installing the
              app.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
