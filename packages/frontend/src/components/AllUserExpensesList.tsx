import { Card, CardHeader, ListItem } from '@mui/material';

import {
  type Sheet,
  type ExpenseListItem,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { formatCurrency } from '../utils/money';
import { formatDateTimeRelative, getExpenseDescription } from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';

const ExpenseListItemComponent = ({
  expense,
  sheet,
}: {
  expense: ExpenseListItem;
  sheet: Sheet;
}) => {
  const descriptionText = getExpenseDescription(expense);

  const title = (
    <>
      <strong>{descriptionText}</strong>{' '}
      {formatCurrency(expense.money, { signDisplay: 'never' })}
    </>
  );

  const subheader = (
    <em>
      {formatDateTimeRelative(expense.spentAt)} on {sheet.name}
    </em>
  );

  return (
    <ListItem sx={{ paddingInline: 0 }}>
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardHeader
          avatar={<CategoryAvatar category={expense.category} />}
          title={title}
          subheader={subheader}
        />
      </Card>
    </ListItem>
  );
};

export const AllUserExpensesList = () => {
  const { data } = trpc.expense.getAllUserExpenses.useQuery({});

  return data?.expenses.map(({ expense, sheet }) => (
    <ExpenseListItemComponent
      key={expense.id}
      expense={expense}
      sheet={sheet}
    />
  ));
};
