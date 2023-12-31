import { forwardRef } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';

import { Select } from '../form/Select';

type ParticipantSelectProps = {
  id?: string;
  groupSheet: GroupSheetByIdResponse;
  value: string | undefined;
  onChange: (val: string) => void;
} & Omit<ControllerRenderProps, 'value' | 'onChange' | 'ref'>;

export const ParticipantSelect = forwardRef<
  HTMLButtonElement,
  ParticipantSelectProps
>(({ id, groupSheet, value, onChange, ...controllerProps }, ref) => {
  const options = Object.values(groupSheet.participants);

  return (
    <Select
      {...controllerProps}
      id={id}
      ref={ref}
      placeholder="Please Select..."
      value={value ?? ''}
      onChange={onChange}
      schema={z.string()}
      options={[
        { label: 'Please Select...', value: undefined, disabled: true },
        ...options.map(({ id: optValue, name: label }) => ({
          value: optValue,
          label,
        })),
      ]}
    />
  );
});
ParticipantSelect.displayName = 'ParticipantSelect';
