import { z } from 'zod';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { Select } from '../form/Select';

export const ParticipantSelect = ({
  id,
  groupSheet,
  value,
  onChange,
  onBlur,
}: {
  id?: string;
  groupSheet: GroupSheetByIdResponse;
  value: string | undefined;
  onChange: (val: string) => void;
  onBlur?: () => void;
}) => {
  const options = Object.values(groupSheet.participants);

  return (
    <Select
      id={id}
      placeholder="Please Select..."
      value={value ?? ''}
      setValue={onChange}
      schema={z.string()}
      onBlur={onBlur}
      options={[
        { label: 'Please Select...', value: undefined, disabled: true },
        ...options.map(({ id: optValue, name: label }) => ({
          value: optValue,
          label,
        })),
      ]}
    />
  );
};
