import {
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
} from '@mui/material';
import { useId } from 'react';
import { z } from 'zod';

import { CategoryId, categories } from '../data/categories';

export const CategorySelect = ({
  category,
  setCategory,
}: {
  category: string | undefined;
  setCategory: (newCategory: CategoryId | undefined) => void;
}) => {
  const selectId = useId();

  return (
    <FormControl fullWidth>
      <InputLabel id={selectId}>Category</InputLabel>
      <Select
        labelId={selectId}
        label="Category"
        value={category ?? ''}
        onChange={(e) => {
          setCategory(
            e.target.value
              ? z.nativeEnum(CategoryId).parse(e.target.value)
              : undefined,
          );
        }}
        SelectDisplayProps={{ style: { display: 'flex', gap: '0.5rem' } }}
      >
        <MenuItem value="">No Category</MenuItem>
        {categories.map(({ id, name, icon }) => (
          <MenuItem key={id} value={id}>
            <ListItemIcon sx={{ minWidth: 'unset' }}>{icon}</ListItemIcon>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
