import { AllUserExpensesList } from '../../components/AllUserExpensesList';
import { Root } from '../Root';

export const ExpensesIndexPage = () => {
  return (
    <Root title="Expenses" mainClassName="p-0">
      <AllUserExpensesList />
    </Root>
  );
};
