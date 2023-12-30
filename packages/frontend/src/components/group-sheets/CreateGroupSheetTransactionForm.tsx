import {
  CheckIcon,
  ThickArrowDownIcon,
  ThickArrowUpIcon,
} from '@radix-ui/react-icons';
import { useState } from 'react';

import type { GroupSheetByIdResponse } from '@nihalgonsalves/expenses-shared/types/sheet';
import type { TransactionType } from '@nihalgonsalves/expenses-shared/types/transaction';
import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { ToggleButtonGroup } from '../form/ToggleButtonGroup';

import { SettlementForm } from './SettlementForm';
import { TransactionForm } from './TransactionForm';

const TYPE_OPTIONS = [
  {
    value: 'EXPENSE',
    label: (
      <>
        <ThickArrowUpIcon className="mr-2 text-xl" />
        Expense
      </>
    ),
  },
  {
    value: 'INCOME',
    label: (
      <>
        <ThickArrowDownIcon className="mr-2 text-xl" />
        Income
      </>
    ),
  },
  {
    value: 'TRANSFER',
    label: (
      <>
        <CheckIcon className="mr-2 text-xl" />
        Settlement
      </>
    ),
  },
] as const;

export const CreateGroupSheetTransactionForm = ({
  groupSheet,
  me,
}: {
  groupSheet: GroupSheetByIdResponse;
  me: User;
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');

  return (
    <div className="flex flex-col gap-4">
      <ToggleButtonGroup
        className="grid w-full grid-cols-3"
        value={type}
        setValue={setType}
        options={TYPE_OPTIONS}
      />
      {type === 'TRANSFER' ? (
        <SettlementForm groupSheet={groupSheet} me={me} />
      ) : (
        <TransactionForm type={type} groupSheet={groupSheet} me={me} />
      )}
    </div>
  );
};
