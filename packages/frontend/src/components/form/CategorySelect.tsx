import { Cross1Icon } from '@radix-ui/react-icons';
import { z } from 'zod';

import { CategoryId, categories } from '../../data/categories';

import { Select, type SelectOption } from './Select';

const schema = z.nativeEnum(CategoryId);

const options: SelectOption<typeof schema>[] = [
  {
    value: undefined,
    label: (
      <span className="flex items-center gap-2 text-muted-foreground">
        <Cross1Icon /> Clear selection
      </span>
    ),
  },
  ...categories.map(({ id, name, icon }) => ({
    value: id,
    label: (
      <span className="flex items-center gap-2">
        {icon} {name}
      </span>
    ),
  })),
];

export const CategorySelect = ({
  category,
  setCategory,
  className,
  placeholder = 'Select Category',
}: {
  category: CategoryId | undefined;
  setCategory: (newCategory: CategoryId | undefined) => void;
  className?: string;
  placeholder?: string;
}) => (
  <Select
    placeholder={placeholder}
    value={category}
    setValue={setCategory}
    schema={schema}
    options={options}
    className={className}
  />
);
