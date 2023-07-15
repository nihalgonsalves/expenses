import { Restaurant } from '@mui/icons-material';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  type SxProps,
} from '@mui/material';
import { Fragment } from 'react';

import { type GetExpensesResponse } from '@nihalgonsalves/expenses-backend';

import { formatCurrency } from '../utils/money';

export const ExpensesList = ({
  expenses,
  sx = {},
}: {
  expenses: GetExpensesResponse;
  sx?: SxProps;
}) => {
  return (
    <List sx={sx} dense>
      {expenses.map((expense) => (
        <Fragment key={expense.id}>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Restaurant />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Stack direction="row" justifyContent="space-between">
                  <span>{expense.description}</span>
                  <span>{formatCurrency(expense.money)}</span>
                </Stack>
              }
              secondary={`Paid by <Unknown>`}
            />
          </ListItem>
        </Fragment>
      ))}
    </List>
  );
};
