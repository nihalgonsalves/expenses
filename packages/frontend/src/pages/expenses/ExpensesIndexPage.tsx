import { AllUserExpensesList } from '../../components/AllUserExpensesList';
import { Root } from '../Root';

export const ExpensesIndexPage = () => {
  return (
    <Root title="Expenses">
      <AllUserExpensesList />
    </Root>
  );
};
