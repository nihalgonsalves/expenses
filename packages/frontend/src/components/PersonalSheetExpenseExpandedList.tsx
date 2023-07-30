import {
  List,
  ListItem,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  type SxProps,
} from '@mui/material';
import { useState } from 'react';

import { type ExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { formatCurrency } from '../utils/money';
import { formatDateTimeRelative, getExpenseDescription } from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';
import { ExpandMoreButton } from './ExpandMoreButton';
import { ExpenseActions } from './ExpenseActions';

const ExpandedExpenseListItem = ({
  expense,
  personalSheetId,
}: {
  expense: ExpenseListItem;
  personalSheetId: string;
}) => {
  const utils = trpc.useContext();

  const [isInvalidating, setIsInvalidating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const descriptionText = getExpenseDescription(expense);

  const title = (
    <>
      <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
    </>
  );

  const subheader = <em>{formatDateTimeRelative(expense.spentAt)}</em>;

  return (
    <ListItem
      sx={{ opacity: isInvalidating ? 0.5 : 'unset', paddingInline: 0 }}
    >
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardHeader
          avatar={<CategoryAvatar category={expense.category} />}
          action={
            <ExpandMoreButton
              expand={expanded}
              onClick={() => {
                setExpanded((prev) => !prev);
              }}
            />
          }
          title={title}
          subheader={subheader}
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ paddingBlock: 0 }}>
            <ExpenseActions
              sheetId={personalSheetId}
              expense={expense}
              setIsInvalidating={setIsInvalidating}
              onDelete={async () => {
                await utils.expense.getPersonalSheetExpenses.invalidate({
                  personalSheetId,
                });
              }}
            />
          </CardContent>
        </Collapse>
      </Card>
    </ListItem>
  );
};

export const PersonalSheetExpensesExpandedList = ({
  personalSheetId,
  expenses,
  sx = {},
}: {
  personalSheetId: string;
  expenses: ExpenseListItem[];
  sx?: SxProps;
}) => {
  return (
    <List sx={sx}>
      {expenses.map((expense) => (
        <ExpandedExpenseListItem
          key={expense.id}
          expense={expense}
          personalSheetId={personalSheetId}
        />
      ))}
    </List>
  );
};
