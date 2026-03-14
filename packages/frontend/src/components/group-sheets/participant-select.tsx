import type { Ref } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import type { GroupSheetByIdResponse } from "@nihalgonsalves/expenses-shared/types/sheet";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../ui/combobox";

type ParticipantSelectProps = {
  id?: string;
  groupSheet: GroupSheetByIdResponse;
  value: string | null;
  onChange: (newValue: string | null) => void;
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
  const options = groupSheet.participants.map((participant) => participant.id);
  const labelById = new Map(
    groupSheet.participants.map((participant) => [
      participant.id,
      participant.name,
    ]),
  );

  return (
    <Combobox<string>
      items={options}
      value={value}
      onValueChange={onChange}
      itemToStringLabel={(item) => labelById.get(item) ?? item}
      filter={(item, query) =>
        labelById
          .get(item)
          ?.toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()) ?? false
      }
    >
      <ComboboxInput
        id={id}
        placeholder="Please select…"
        ref={ref}
        {...controllerProps}
      />

      <ComboboxContent>
        <ComboboxEmpty>No participants found.</ComboboxEmpty>
        <ComboboxList>
          {(option: string) => (
            <ComboboxItem key={option} value={option}>
              {labelById.get(option)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
