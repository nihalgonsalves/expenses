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

import { type SplitGroupExpense } from '../db/types';
import { formatCurrency } from '../money';

export const ExpensesList = ({
  expenses,
  participantNamesById,
  sx,
}: {
  expenses: SplitGroupExpense[];
  participantNamesById: Record<string, string>;
  sx?: SxProps;
}) => {
  return (
    <List sx={sx ?? {}} dense>
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
                  <span>{expense.notes || expense.category}</span>
                  <span>{formatCurrency(expense.money)}</span>
                </Stack>
              }
              secondary={`Paid by ${
                participantNamesById[expense.paidById] ?? 'Unknown'
              }`}
            />
          </ListItem>
        </Fragment>
      ))}
    </List>
  );
};
