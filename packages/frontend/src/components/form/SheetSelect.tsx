import { forwardRef, useMemo } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { z } from "zod";

import { trpc } from "../../api/trpc";

import { Select, type SelectOption } from "./Select";

const schema = z.string().min(1).optional();
type Schema = z.infer<typeof schema>;

type SheetSelectProps = {
  placeholder?: string;
  className?: string;
  value: Schema;
  onChange: (value: Schema) => void;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

const emptyOption = {
  label: <span className="opacity-80">Clear Selection</span>,
  value: undefined,
} satisfies SelectOption<typeof schema>;

export const SheetSelect = forwardRef<HTMLButtonElement, SheetSelectProps>(
  (
    {
      placeholder = "Select a sheet",
      value,
      onChange,
      className,
      ...controllerProps
    },
    ref,
  ) => {
    const { data: sheets } = trpc.sheet.mySheets.useQuery({
      includeArchived: false,
    });

    const options = useMemo(
      () => [
        ...(value ? [emptyOption] : []),
        ...(sheets?.map(
          ({ id, name }): SelectOption<typeof schema> => ({
            label: name,
            value: id,
          }),
        ) ?? []),
      ],
      [value, sheets],
    );

    return (
      <Select
        {...controllerProps}
        className={className}
        ref={ref}
        placeholder={placeholder}
        options={options}
        value={value}
        onChange={onChange}
        schema={schema}
      />
    );
  },
);
SheetSelect.displayName = "SheetSelect";
