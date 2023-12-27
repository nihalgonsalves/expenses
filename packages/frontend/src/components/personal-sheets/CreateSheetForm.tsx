import { PlusCircledIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { Button } from '../form/Button';
import { CurrencySelect } from '../form/CurrencySelect';
import { TextField } from '../form/TextField';

export const CreateSheetForm = ({
  defaultCurrencyCode,
}: {
  defaultCurrencyCode: string;
}) => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const utils = trpc.useUtils();
  const { mutateAsync: createSheet, isLoading } =
    trpc.sheet.createPersonalSheet.useMutation();

  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState(defaultCurrencyCode);

  const handleCreateSheet = async () => {
    const { id } = await createSheet({
      name,
      currencyCode,
    });

    navigate(`/sheets/${id}`, { replace: true });

    await utils.sheet.mySheets.invalidate();
  };

  const valid = name !== '';
  const disabled = !valid || !onLine;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;

        void handleCreateSheet();
      }}
    >
      <TextField
        label="Sheet name"
        autoFocus
        placeholder="Personal Expenses"
        required
        value={name}
        setValue={setName}
      />

      <CurrencySelect
        currencyCode={currencyCode}
        setCurrencyCode={setCurrencyCode}
      />

      <Button
        className="mt-4 w-full"
        type="submit"
        disabled={disabled}
        isLoading={isLoading}
      >
        <PlusCircledIcon className="mr-2" /> Create Sheet
      </Button>
    </form>
  );
};
