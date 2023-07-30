import {
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  type SxProps,
} from '@mui/material';
import { useState } from 'react';

import { type GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { formatCurrency } from '../utils/money';
import {
  formatDateTimeRelative,
  getExpenseDescription,
  getGroupSheetExpenseSummaryText,
  getInitials,
} from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';
import { ExpandMoreButton } from './ExpandMoreButton';
import { ExpenseActions } from './ExpenseActions';
import { ParticipantListItem } from './ParticipantListItem';

const ExpandedExpenseListItem = ({
  expense,
  groupSheetId,
}: {
  expense: GroupSheetExpenseListItem;
  groupSheetId: string;
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

  const subheader = (
    <>
      {getGroupSheetExpenseSummaryText(expense)}
      <br />
      <em>{formatDateTimeRelative(expense.spentAt)}</em>
    </>
  );

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
            {expense.type === 'EXPENSE' && (
              <List dense sx={{ paddingBlockStart: 0 }}>
                {expense.participants
                  .filter(({ balance: { amount } }) => amount !== 0)
                  .map(({ id, name, balance }) => (
                    <ParticipantListItem key={id} avatar={getInitials(name)}>
                      <ListItemText
                        primary={name}
                        secondary={`${
                          balance.amount < 0 ? 'Receives' : 'Owes'
                        } ${formatCurrency(balance, {
                          signDisplay: 'never',
                        })}`}
                      />
                    </ParticipantListItem>
                  ))}
              </List>
            )}
            <ExpenseActions
              sheetId={groupSheetId}
              expense={expense}
              setIsInvalidating={setIsInvalidating}
              onDelete={async () => {
                await Promise.all([
                  utils.expense.getGroupSheetExpenses.invalidate({
                    groupSheetId,
                  }),
                  utils.expense.getParticipantSummaries.invalidate(
                    groupSheetId,
                  ),
                ]);
              }}
            />
          </CardContent>
        </Collapse>
      </Card>
    </ListItem>
  );
};

export const GroupSheetExpensesExpandedList = ({
  groupSheetId,
  expenses,
  sx = {},
}: {
  groupSheetId: string;
  expenses: GroupSheetExpenseListItem[];
  sx?: SxProps;
}) => {
  return (
    <List sx={sx}>
      {expenses.map((expense) => (
        <ExpandedExpenseListItem
          key={expense.id}
          expense={expense}
          groupSheetId={groupSheetId}
        />
      ))}
    </List>
  );
};
