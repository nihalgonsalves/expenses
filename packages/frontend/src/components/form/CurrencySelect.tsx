import { ChevronsUpDownIcon } from "lucide-react";
import type { Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { CURRENCY_CODES } from "../../utils/money";
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxIcon,
  ComboboxTrigger,
  ComboboxItemIndicator,
  ComboboxPortal,
} from "../ui/combobox";

type CurrencySelectProps = {
  id?: string;
  value: string;
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
    <div className="relative">
      <ComboboxInput placeholder="e.g. EUR" ref={ref} {...controllerProps} />

      <ComboboxTrigger className="absolute top-0 right-0 border-none">
        <ComboboxIcon>
          <ChevronsUpDownIcon className="size-4" />
        </ComboboxIcon>
      </ComboboxTrigger>
    </div>

    <ComboboxPortal>
      <ComboboxPositioner align="start" sideOffset={4}>
        <ComboboxPopup className="w-full pt-0" aria-label="Select currency">
          <ComboboxEmpty>No currency codes found.</ComboboxEmpty>
          <ComboboxList>
            {(code: string) => (
              <ComboboxItem key={code} value={code}>
                <ComboboxItemIndicator />
                <div className="col-start-2">{code}</div>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </ComboboxPositioner>
    </ComboboxPortal>
  </Combobox>
);
