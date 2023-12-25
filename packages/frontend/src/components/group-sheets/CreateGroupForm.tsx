import { PersonIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { produce } from 'immer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { prevalidateEmail } from '../../utils/utils';
import { Button } from '../form/Button';
import { CurrencySelect } from '../form/CurrencySelect';
import { TextField } from '../form/TextField';

export const CreateGroupForm = ({
  defaultCurrencyCode,
}: {
  defaultCurrencyCode: string;
}) => {
  const navigate = useNavigate();
  const onLine = useNavigatorOnLine();

  const utils = trpc.useUtils();
  const { mutateAsync: createGroupSheet, isLoading } =
    trpc.sheet.createGroupSheet.useMutation();

  const [groupSheetName, setGroupSheetName] = useState('');
  const [currencyCode, setCurrencyCode] = useState(defaultCurrencyCode);

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

    navigate(`/groups/${id}`, { replace: true });

    await utils.sheet.mySheets.invalidate();
  };

  const valid =
    groupSheetName !== '' &&
    participantEmails.every((e) => prevalidateEmail(e));

  const disabled = !valid || !onLine;

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();

        if (disabled) return;

        void handleCreateGroupSheet();
      }}
    >
      <TextField
        label="Group name"
        placeholder="WG Expenses"
        autoFocus
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
          <Button
            className="btn-square btn-ghost text-xl text-error"
            aria-label="Delete"
            onClick={() => {
              handleDeleteParticipant(i);
            }}
          >
            <TrashIcon />
          </Button>
        </div>
      ))}

      <Button
        className="btn-primary btn-outline btn-block mt-4"
        onClick={handleAddParticipant}
      >
        <PersonIcon />
        Add Participant
      </Button>

      <div className="divider" />

      <Button
        type="submit"
        className="btn-primary"
        disabled={disabled}
        isLoading={isLoading}
      >
        <PlusIcon /> Create Group
      </Button>
    </form>
  );
};
