import { trpc } from '../../api/trpc';
import { AllUserExpensesList } from '../../components/AllUserExpensesList';
import { RootLoader } from '../Root';

export const ExpensesIndexPage = () => {
  const result = trpc.expense.getAllUserExpenses.useQuery({});

  return (
    <RootLoader
      result={result}
      title="Expenses"
      mainClassName="p-0"
      render={(data) => <AllUserExpensesList data={data} />}
    />
  );
};
