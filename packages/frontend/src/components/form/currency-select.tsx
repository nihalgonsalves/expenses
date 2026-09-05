import type { Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { CURRENCY_CODES } from "../../utils/money";
import { getUserLanguage } from "../../utils/utils";
import {
  Combobox,
  ComboboxCollection,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxContent,
  ComboboxGroup,
  ComboboxLabel,
} from "../ui/combobox";

type CurrencySelectProps = {
  id?: string;
  value: string | undefined;
  onChange: (newCode: string | null) => void;
  options?: string[] | undefined;
  frequentOptions?: string[] | undefined;
  ref?: Ref<HTMLInputElement>;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

const EMPTY_CURRENCY_OPTIONS: string[] = [];

type CurrencyGroup = {
  label: string;
  items: string[];
};

const getCurrencyDetails = (code: string) => {
  const locale = getUserLanguage();
  const name = new Intl.DisplayNames(locale, { type: "currency" }).of(code);
  const symbol = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    currencyDisplay: "symbol",
  })
    .formatToParts(0)
    .find(({ type }) => type === "currency")?.value;

  return { code, name: name ?? code, symbol: symbol ?? code };
};

const CurrencyOption = ({ code }: { code: string }) => {
  const { name, symbol } = getCurrencyDetails(code);

  return (
    <ComboboxItem className="items-start py-1.5" value={code}>
      <span className="min-w-0">
        <span className="flex items-baseline gap-1.5 font-medium">
          <span>{code}</span>
          {symbol !== code && (
            <span className="text-muted-foreground font-normal">{symbol}</span>
          )}
        </span>
        <span className="text-muted-foreground block text-xs leading-tight whitespace-normal">
          {name}
        </span>
      </span>
    </ComboboxItem>
  );
};

export const CurrencySelect = ({
  value,
  onChange,
  options = CURRENCY_CODES,
  frequentOptions = EMPTY_CURRENCY_OPTIONS,
  ref,
  ...controllerProps
}: CurrencySelectProps) => {
  const frequent = frequentOptions.filter((code) => options.includes(code));
  const frequentSet = new Set(frequent);
  const remaining = options.filter((code) => !frequentSet.has(code));
  const groups: CurrencyGroup[] = [
    ...(frequent.length > 0
      ? [{ label: "Frequently used", items: frequent }]
      : []),
    { label: "All currencies", items: remaining },
  ];

  return (
    <Combobox<string>
      items={groups}
      value={value}
      onValueChange={onChange}
      filter={(code, query) => {
        const { name, symbol } = getCurrencyDetails(code);
        const normalizedQuery = query.toLocaleLowerCase();
        return [code, name, symbol].some((part) =>
          part.toLocaleLowerCase().includes(normalizedQuery),
        );
      }}
      itemToStringLabel={(code) => {
        const { symbol } = getCurrencyDetails(code);
        return symbol === code ? code : `${code} · ${symbol}`;
      }}
    >
      <ComboboxInput
        placeholder="e.g. EUR"
        ref={ref}
        selectOnFocus
        {...controllerProps}
      />

      <ComboboxContent>
        <ComboboxEmpty>No currency codes found.</ComboboxEmpty>
        <ComboboxList>
          {(group: CurrencyGroup) => (
            <ComboboxGroup key={group.label} items={group.items}>
              <ComboboxLabel>{group.label}</ComboboxLabel>
              <ComboboxCollection>
                {(code: string) => <CurrencyOption key={code} code={code} />}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
