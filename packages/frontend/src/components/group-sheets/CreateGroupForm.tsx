import { produce } from 'immer';
import { useState } from 'react';
import { MdAddCircle, MdDeleteOutline, MdPersonAdd } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { getCurrencyCode } from '../../utils/money';
import { prevalidateEmail } from '../../utils/utils';
import { CurrencySelect } from '../form/CurrencySelect';
import { LoadingButton } from '../form/LoadingButton';
import { TextField } from '../form/TextField';

export const CreateGroupForm = () => {
  const navigate = useNavigate();

  const {
    mutateAsync: createGroupSheet,
    isLoading,
    error,
  } = trpc.sheet.createGroupSheet.useMutation();

  const [groupSheetName, setGroupSheetName] = useState('');
  const [currencyCode, setCurrencyCode] = useState(getCurrencyCode());

  const [participantEmails, setParticipantEmails] = useState<string[]>([]);

  const handleAddParticipant = () => {
    setParticipantEmails((prev) => [...prev, '']);
  };

  const handleChangeParticipant = (index: number, value: string) => {
    setParticipantEmails(
      produce((draft) => {
        draft[index] = value;
      }),
    );
  };

  const handleDeleteParticipant = (index: number) => {
    setParticipantEmails(
      produce((draft) => {
        draft.splice(index, 1);
      }),
    );
  };

  const handleCreateGroupSheet = async () => {
    const { id } = await createGroupSheet({
      name: groupSheetName,
      currencyCode,
      additionalParticipantEmailAddresses: participantEmails,
    });

    navigate(`/groups/${id}`);
  };

  const valid =
    groupSheetName && participantEmails.every((e) => prevalidateEmail(e));

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();

        if (!valid) return;

        void handleCreateGroupSheet();
      }}
    >
      {error && <div className="alert alert-error">{error.message}</div>}

      <TextField
        label="Group name"
        placeholder="WG Expenses"
        value={groupSheetName}
        setValue={setGroupSheetName}
      />

      <CurrencySelect
        currencyCode={currencyCode}
        setCurrencyCode={setCurrencyCode}
      />

      {participantEmails.map((participant, i) => (
        // this is a list of inputs without an ID that won't be re-ordered
        // eslint-disable-next-line react/no-array-index-key
        <div key={i} className="flex items-end">
          <TextField
            label={`Participant ${i + 1}'s email`}
            type="email"
            autoComplete="email"
            value={participant}
            setValue={(val) => {
              handleChangeParticipant(i, val);
            }}
            className="flex-grow"
          />
          <button
            type="button"
            className="btn btn-square btn-ghost text-xl text-error"
            aria-label="Delete"
            onClick={() => {
              handleDeleteParticipant(i);
            }}
          >
            <MdDeleteOutline />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-primary btn-outline btn-block mt-4"
        onClick={handleAddParticipant}
      >
        <MdPersonAdd />
        Add Participant
      </button>

      <div className="divider" />

      <LoadingButton
        type="submit"
        className="btn-blocksd btn-primary"
        disabled={!valid}
        isLoading={isLoading}
      >
        <MdAddCircle /> Create Group
      </LoadingButton>
    </form>
  );
};
