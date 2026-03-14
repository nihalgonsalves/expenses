import { useQuery } from "@tanstack/react-query";
import { useState, type Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { useTRPC } from "../../api/trpc";
import { CategoryIcon } from "../category-avatar";
import {
  Combobox,
  ComboboxItem,
  ComboboxContent,
  ComboboxInput,
  ComboboxList,
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
      <ComboboxInput placeholder={placeholder} showClear {...controllerProps} />

      <ComboboxContent>
        <ComboboxList>
          {(category: string) => (
            <ComboboxItem key={category} value={category}>
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
      </ComboboxContent>
    </Combobox>
  );
};
