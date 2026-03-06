import type { Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { CURRENCY_CODES } from "../../utils/money";
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxContent,
} from "../ui/combobox";

type CurrencySelectProps = {
  id?: string;
  value: string | undefined;
  onChange: (newCode: string | null) => void;
  options?: string[];
  ref?: Ref<HTMLInputElement>;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const CurrencySelect = ({
  value,
  onChange,
  options = CURRENCY_CODES,
  ref,
  ...controllerProps
}: CurrencySelectProps) => (
  <Combobox items={options} value={value} onValueChange={onChange}>
    <ComboboxInput placeholder="e.g. EUR" ref={ref} {...controllerProps} />

    <ComboboxContent>
      <ComboboxEmpty>No currency codes found.</ComboboxEmpty>
      <ComboboxList>
        {(code: string) => (
          <ComboboxItem key={code} value={code}>
            <div className="col-start-2">{code}</div>
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
);
