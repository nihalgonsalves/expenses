import { z } from 'zod';

import { CategoryId, categories } from '../../data/categories';

import { Select, type SelectOption } from './Select';

const schema = z.nativeEnum(CategoryId);

const options: SelectOption<typeof schema>[] = [
  {
    value: '' as const,
    label: 'No category',
  },
  ...categories.map(({ id, name }) => ({
    value: id,
    label: name,
  })),
];

export const CategorySelect = ({
  category,
  setCategory,
}: {
  category: CategoryId | undefined;
  setCategory: (newCategory: CategoryId | undefined) => void;
}) => (
  <Select
    label="Category"
    value={category}
    setValue={setCategory}
    schema={schema}
    options={options}
  />
);
