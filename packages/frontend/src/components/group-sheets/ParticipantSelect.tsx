import type { ComponentProps } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { z } from "zod";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import { Select } from "../form/Select";

type ParticipantSelectProps = {
  id?: string;
  groupSheet: GroupSheetByIdResponse;
  value: string | undefined;
  onChange: (val: string) => void;
} & Pick<ComponentProps<typeof Select>, "ref"> &
  Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

export const ParticipantSelect = ({
  ref,
  id,
  groupSheet,
  value,
  onChange,
  ...controllerProps
}: ParticipantSelectProps) => {
  const options = Object.values(groupSheet.participants);

  return (
    <Select
      {...controllerProps}
      id={id}
      ref={ref}
      placeholder="Please Select..."
      value={value ?? ""}
      onChange={onChange}
      schema={z.string()}
      options={[
        { label: "Please Select...", value: undefined, disabled: true },
        ...options.map(({ id: optValue, name: label }) => ({
          value: optValue,
          label,
        })),
      ]}
    />
  );
};
