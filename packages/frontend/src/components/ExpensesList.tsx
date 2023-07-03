import { Restaurant } from '@mui/icons-material';
import {
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from '@mui/material';
import { Fragment } from 'react';

import { type SplitGroupDocument } from '../db/types';
import { formatCurrency } from '../money';

export const ExpensesList = ({ group }: { group: SplitGroupDocument }) => {
  return (
    <List dense>
      {group.expenses.map((expense) => (
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
                  <span>{expense.category}</span>
                  <span>{formatCurrency(expense.money)}</span>
                </Stack>
              }
              secondary="Pizza"
            />
          </ListItem>

          <Divider />
        </Fragment>
      ))}
    </List>
  );
};
