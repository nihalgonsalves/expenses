import { ListItemIcon } from '@mui/material';
import { z } from 'zod';

import { CategoryId, categories } from '../data/categories';

import { Select } from './Select';

const options = [
  {
    value: '' as const,
    display: 'No category',
  },
  ...categories.map(({ id, name, icon }) => ({
    value: id,
    display: (
      <>
        <ListItemIcon sx={{ minWidth: 'unset' }}>{icon}</ListItemIcon>
        {name}
      </>
    ),
  })),
];

export const CategorySelect = ({
  category,
  setCategory,
}: {
  category: CategoryId | undefined;
  setCategory: (newCategory: CategoryId | undefined) => void;
}) => {
  return (
    <Select
      label="Category"
      value={category}
      setValue={setCategory}
      schema={z.nativeEnum(CategoryId)}
      options={options}
      muiFormControlProps={{ fullWidth: true }}
    />
  );
};
