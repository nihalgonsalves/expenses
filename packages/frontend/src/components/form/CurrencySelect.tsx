import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Popover } from '@radix-ui/react-popover';
import { useMemo, useState } from 'react';

import { CURRENCY_CODES } from '../../utils/money';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../ui/command';
import { PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../ui/utils';

export const CurrencySelect = ({
  currencyCode,
  setCurrencyCode,
  options = CURRENCY_CODES,
}: {
  currencyCode: string;
  setCurrencyCode: (newCode: string) => void;
  label?: string;
  options?: string[];
}) => {
  const [open, setOpen] = useState(false);

  const optionObjects = useMemo(
    () =>
      options.map((o) => ({
        value: o,
        label: o,
      })),
    [options],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-48 justify-between"
        >
          {currencyCode
            ? optionObjects.find((opt) => opt.value === currencyCode)?.label
            : 'Select'}
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command className="max-h-80">
          <CommandInput placeholder="Search" />
          <CommandEmpty>No currency code found.</CommandEmpty>
          <CommandGroup className="h-full overflow-y-auto">
            {optionObjects.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => {
                  setCurrencyCode(option.value);
                  setOpen(false);
                }}
              >
                <CheckIcon
                  className={cn(
                    'mr-2 size-4',
                    currencyCode === option.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
