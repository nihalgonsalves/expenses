import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useState, type Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { useTRPC } from "../../api/trpc";
import { CategoryIcon } from "../CategoryAvatar";
import {
  Combobox,
  ComboboxItem,
  ComboboxList,
  ComboboxInput,
  ComboboxPopup,
  ComboboxPositioner,
  ComboboxIcon,
  ComboboxTrigger,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxClear,
} from "../ui/combobox";

export const OTHER_CATEGORY = "other";

type CategorySelectProps = {
  id?: string;
  value: string | undefined;
  onChange: (newCategory: string | null | undefined) => void;
  placeholder?: string;
  ref?: Ref<HTMLInputElement>;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const CategorySelect = ({
  value,
  onChange,
  placeholder = "Select a category",
  ...controllerProps
}: CategorySelectProps) => {
  const [searchValue, setSearchValue] = useState("");

  const { trpc } = useTRPC();
  const { data: categories = [] } = useQuery(
    trpc.transaction.getCategories.queryOptions(),
  );

  // issues with rendering inside the Vaul drawer
  const [portalRef, setPortalRef] = useState<HTMLDivElement | null>(null);

  const categoryIds = categories.map((c) => c.id);
  const categoryIdsSet = new Set(categoryIds);

  const items =
    value && !categoryIdsSet.has(value)
      ? // selected "create" value
        [...categoryIds, value]
      : searchValue.length > 0 && !categoryIdsSet.has(searchValue)
        ? // suggested to-create value
          [...categoryIds, searchValue]
        : categoryIds;

  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      onInputValueChange={setSearchValue}
    >
      <div className="relative">
        <ComboboxInput placeholder={placeholder} {...controllerProps} />

        <div className="absolute top-0 right-2 flex">
          <ComboboxClear />

          <ComboboxTrigger className="p-2">
            <ComboboxIcon>
              <CaretSortIcon className="size-4" />
            </ComboboxIcon>
          </ComboboxTrigger>
        </div>
      </div>

      <div ref={setPortalRef} className="contents" />

      <ComboboxPortal container={portalRef}>
        <ComboboxPositioner align="start" sideOffset={4}>
          <ComboboxPopup className="w-full pt-0" aria-label="Select category">
            <ComboboxList>
              {(category: string) => (
                <ComboboxItem key={category} value={category}>
                  <ComboboxItemIndicator />
                  <div className="col-start-2 flex gap-2">
                    <div className="mr-2">
                      <CategoryIcon category={category} />
                    </div>
                    {categoryIdsSet.has(category)
                      ? category
                      : `Create: "${category}"`}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </Combobox>
  );
};
