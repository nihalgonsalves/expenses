import { useState } from 'react';
import { MdAddCircle } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { getCurrencyCode } from '../../utils/money';
import { CurrencySelect } from '../form/CurrencySelect';
import { LoadingButton } from '../form/LoadingButton';
import { TextField } from '../form/TextField';

export const CreateSheetForm = () => {
  const navigate = useNavigate();

  const {
    mutateAsync: createSheet,
    isLoading,
    error,
  } = trpc.sheet.createPersonalSheet.useMutation();

  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState(getCurrencyCode());

  const handleCreateSheet = async () => {
    const { id } = await createSheet({
      name,
      currencyCode,
    });
    navigate(`/sheets/${id}`);
  };

  const valid = name;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;

        void handleCreateSheet();
      }}
    >
      {error && <div className="alert alert-error">{error.message}</div>}

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

      <LoadingButton
        className="btn-block mt-4"
        type="submit"
        disabled={!valid}
        isLoading={isLoading}
      >
        <MdAddCircle /> Create Sheet
      </LoadingButton>
    </form>
  );
};
