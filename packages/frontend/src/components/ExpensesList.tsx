import { QuestionMark } from '@mui/icons-material';
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

import { categoryById } from '../data/categories';
import { formatCurrency } from '../utils/money';
import { formatDateTime, joinList } from '../utils/utils';

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
                {categoryById[expense.category]?.icon ?? <QuestionMark />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Stack direction="row" justifyContent="space-between">
                  <span>
                    {expense.description ||
                      categoryById[expense.category]?.name}
                  </span>
                  <span>{formatCurrency(expense.money)}</span>
                </Stack>
              }
              secondary={
                <Stack direction="row" justifyContent="space-between">
                  <span>
                    {joinList(expense.paidBy.map(({ name }) => name))}
                    {' paid for '}
                    {joinList(expense.paidFor.map(({ name }) => name))}
                  </span>
                  <span>{formatDateTime(expense.spentAt)}</span>
                </Stack>
              }
            />
          </ListItem>
        </Fragment>
      ))}
    </List>
  );
};
