import { type z } from 'zod';

import { clsxtw } from '../../utils/utils';

export type SelectOption<T extends z.Schema<string | undefined>> = {
  label: React.ReactNode;
  value: z.infer<T> | '';
};

export const Select = <T extends z.Schema<string | undefined>>({
  label,
  options,
  value,
  setValue,
  schema,
  className,
}: {
  label: string;
  options: SelectOption<T>[];
  value: z.infer<T> | undefined;
  setValue: (newValue: z.infer<T>) => void;
  schema: T;
  small?: boolean;
  className?: string;
}) => {
  return (
    <div className={clsxtw('form-control', className)}>
      <label className="label label-text">{label}</label>
      <select
        className="select select-bordered"
        value={value}
        onChange={(e) => {
          setValue(e.target.value ? schema.parse(e.target.value) : undefined);
        }}
      >
        {options.map(({ label: display, value: optValue }) => (
          <option key={optValue} value={optValue}>
            {display}
          </option>
        ))}
      </select>
    </div>
  );
};