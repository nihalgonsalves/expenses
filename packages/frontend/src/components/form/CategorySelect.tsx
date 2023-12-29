import { PlusIcon } from '@radix-ui/react-icons';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { Popover } from '@radix-ui/react-popover';
import { useState } from 'react';

import { trpc } from '../../api/trpc';
import { CategoryIcon } from '../CategoryAvatar';
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

export const OTHER_CATEGORY = 'other' as const;

export const CategorySelect = ({
  categoryId,
  setCategoryId,
  className,
  placeholder = 'Select a category',
  allowCreate = true,
}: {
  categoryId: string | undefined;
  setCategoryId: (newCategory: string | undefined) => void;
  className?: string;
  placeholder?: string;
  allowCreate?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const normalizedSearchValue = searchValue.toLowerCase();

  const { data: categories } = trpc.transaction.getCategories.useQuery();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('min-w-48 justify-between', className)}
        >
          {categoryId ?? placeholder}
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command className="max-h-80">
          <CommandInput
            placeholder="Search"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          {/* Only displayed when allowCreate=false, as otherwise there's always a CommandItem */}
          <CommandEmpty>No category found</CommandEmpty>
          <CommandGroup className="h-full overflow-y-auto">
            {allowCreate &&
              normalizedSearchValue.length > 2 &&
              !categories?.some((c) => c.id === normalizedSearchValue) && (
                <CommandItem
                  value={normalizedSearchValue}
                  onSelect={() => {
                    setCategoryId(normalizedSearchValue);
                    setOpen(false);
                  }}
                >
                  <PlusIcon className="mr-2 size-4" />
                  Create {`'${normalizedSearchValue}'`}
                </CommandItem>
              )}

            {categories?.map((category) => (
              <CommandItem
                key={category.id}
                value={category.id}
                onSelect={() => {
                  setCategoryId(category.id);
                  setOpen(false);
                }}
              >
                <div className="mr-2">
                  <CategoryIcon category={category.id} />
                </div>
                {category.id}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
