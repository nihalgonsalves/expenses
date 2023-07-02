import { Temporal } from '@js-temporal/polyfill';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useId } from 'react';

export const EditExpenseForm = () => {
  const categorySelectId = useId();

  return (
    <>
      <form>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              label="How much did you spend?"
              inputProps={{ inputMode: 'decimal' }}
              placeholder={new Intl.NumberFormat().format(12.34)}
            />
            <Select value="EUR">
              <MenuItem value="EUR">€</MenuItem>
            </Select>
          </Stack>

          <FormControl fullWidth>
            <InputLabel id={categorySelectId}>Category</InputLabel>
            <Select labelId={categorySelectId} value="food" label="Category">
              <MenuItem value="food">Food</MenuItem>
            </Select>
          </FormControl>

          <TextField fullWidth label="Notes" />

          <TextField
            fullWidth
            label="When?"
            type="datetime-local"
            value={Temporal.Now.plainDateTimeISO().round('seconds').toString()}
          />
        </Stack>
      </form>
    </>
  );
};
