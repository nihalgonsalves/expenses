import { MdCloudUpload, MdDeleteOutline, MdListAlt } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

import type { ExpenseListItem } from '@nihalgonsalves/expenses-shared/types/expense';
import type { Sheet } from '@nihalgonsalves/expenses-shared/types/sheet';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { formatCurrency } from '../../utils/money';
import {
  formatDateTimeRelative,
  getExpenseDescription,
} from '../../utils/utils';
import { CategoryAvatar } from '../CategoryAvatar';
import { ConfirmButton } from '../form/ConfirmButton';

import { ExportPersonalExpensesButtonGroup } from './ExportPersonalExpensesButtonGroup';

const ExpenseListItemComponent = ({
  expense,
}: {
  expense: ExpenseListItem;
}) => {
  const descriptionText = getExpenseDescription(expense);
  return (
    <div className="flex flex-row gap-4 text-sm">
      <CategoryAvatar category={expense.category} />
      <div className="flex flex-col">
        <span>
          <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
        </span>
        <span>{formatDateTimeRelative(expense.spentAt)}</span>
      </div>
    </div>
  );
};

export const PersonalSheet = ({ personalSheet }: { personalSheet: Sheet }) => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const utils = trpc.useContext();

  const { data: personalSheetExpensesResponse } =
    trpc.expense.getPersonalSheetExpenses.useQuery({
      personalSheetId: personalSheet.id,
    });
  const { mutateAsync: deleteSheet, isLoading: deleteSheetLoading } =
    trpc.sheet.deleteSheet.useMutation();

  const handleDelete = async () => {
    await deleteSheet(personalSheet.id);
    void utils.sheet.personalSheetById.invalidate(personalSheet.id);
    void utils.sheet.mySheets.invalidate();
    navigate('/sheets');
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Latest Expenses</h2>

      {personalSheetExpensesResponse?.expenses
        .slice(0, 4)
        .map((expense) => (
          <ExpenseListItemComponent key={expense.id} expense={expense} />
        ))}

      <Link
        to={`/sheets/${personalSheet.id}/expenses`}
        className="btn btn-primary btn-outline "
      >
        <MdListAlt /> All Expenses ({personalSheetExpensesResponse?.total})
      </Link>

      <div className="divider" />

      <Link
        to={`/sheets/${personalSheet.id}/import`}
        className="join-item flex-grow btn btn-primary btn-outline"
      >
        <MdCloudUpload />
        Import Expenses (CSV)
      </Link>

      <ExportPersonalExpensesButtonGroup personalSheet={personalSheet} />

      <ConfirmButton
        isLoading={deleteSheetLoading}
        label={
          <>
            <MdDeleteOutline /> Delete Sheet
          </>
        }
        disabled={!onLine}
        confirmLabel="Confirm Delete (Irreversible)"
        handleConfirmed={handleDelete}
      />
    </div>
  );
};
