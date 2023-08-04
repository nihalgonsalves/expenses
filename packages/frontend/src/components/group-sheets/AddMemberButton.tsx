import { useState } from 'react';
import { MdCheck, MdClear, MdPersonAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { prevalidateEmail } from '../../utils/utils';
import { Avatar } from '../Avatar';
import { Button } from '../form/Button';
import { TextField } from '../form/TextField';

import { ParticipantListItem } from './ParticipantListItem';

export const AddMemberButton = ({ groupSheetId }: { groupSheetId: string }) => {
  const { mutateAsync: addGroupSheetMember, isLoading } =
    trpc.sheet.addGroupSheetMember.useMutation();
  const utils = trpc.useContext();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [email, setEmail] = useState('');

  const valid = prevalidateEmail(email);

  const handleClose = () => {
    setAddMemberOpen(false);
    setEmail('');
  };

  const handleAddMember = async () => {
    await addGroupSheetMember({
      groupSheetId,
      email,
    });

    await Promise.all([
      utils.sheet.groupSheetById.invalidate(groupSheetId),
      utils.expense.getParticipantSummaries.invalidate(groupSheetId),
    ]);

    handleClose();
  };

  return addMemberOpen ? (
    <ParticipantListItem className="items-end" avatar={<Avatar name="" />}>
      <form
        className="flex flex-grow items-end gap-2"
        onSubmit={(e) => {
          if (!valid) {
            return;
          }

          e.preventDefault();
          void handleAddMember();
        }}
      >
        <TextField
          className="flex-grow"
          autoFocus
          label={null}
          placeholder="Email address"
          disabled={isLoading}
          value={email}
          setValue={setEmail}
        />

        <Button
          className="btn-square"
          type="reset"
          aria-label="Cancel"
          onClick={handleClose}
        >
          <MdClear />
        </Button>

        <Button
          className="btn-square"
          type="submit"
          aria-label="Add"
          disabled={!valid}
        >
          <MdCheck />
        </Button>
      </form>
    </ParticipantListItem>
  ) : (
    <Button
      className="btn-primary btn-outline"
      onClick={() => {
        setAddMemberOpen(true);
      }}
    >
      <MdPersonAdd />
      Add Participant
    </Button>
  );
};
