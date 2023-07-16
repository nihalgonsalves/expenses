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
import { joinList } from '../utils/utils';

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
                  <span>{expense.description || 'No description'}</span>
                  <span>{formatCurrency(expense.money)}</span>
                </Stack>
              }
              secondary={
                <>
                  <i>{joinList(expense.paidBy.map(({ name }) => name))}</i>
                  {' paid for '}
                  <i>{joinList(expense.paidFor.map(({ name }) => name))}</i>
                </>
              }
            />
          </ListItem>
        </Fragment>
      ))}
    </List>
  );
};
