import type { Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import { Select } from "../form/Select";

type ParticipantSelectProps = {
  id?: string;
  groupSheet: GroupSheetByIdResponse;
  value: string | undefined;
  onChange: (newValue: string | undefined) => void;
  ref?: Ref<HTMLInputElement> | undefined;
} & Omit<ControllerRenderProps, "value" | "onChange" | "ref">;

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
      placeholder="Please select…"
      value={value}
      onChange={onChange}
      options={options.map(({ id: optValue, name: label }) => ({
        value: optValue,
        label,
      }))}
    />
  );
};
