import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { MdCheck, MdClear, MdPersonAdd } from 'react-icons/md';

import { trpc } from '../../api/trpc';
import { prevalidateEmail } from '../../utils/utils';
import { Avatar } from '../Avatar';
import { ParticipantListItem } from '../ParticipantListItem';
import { TextField } from '../form/TextField';

export const AddMemberButton = ({ groupSheetId }: { groupSheetId: string }) => {
  const { enqueueSnackbar } = useSnackbar();

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
    try {
      await addGroupSheetMember({
        groupSheetId,
        email,
      });

      await Promise.all([
        utils.sheet.groupSheetById.invalidate(groupSheetId),
        utils.expense.getParticipantSummaries.invalidate(groupSheetId),
      ]);

      handleClose();
    } catch (e) {
      enqueueSnackbar(
        `Error adding participant: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
    }
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

        <button
          className="btn btn-square"
          type="reset"
          aria-label="Cancel"
          onClick={handleClose}
        >
          <MdClear />
        </button>

        <button
          className="btn btn-square"
          type="submit"
          aria-label="Add"
          disabled={!valid}
        >
          <MdCheck />
        </button>
      </form>
    </ParticipantListItem>
  ) : (
    <button
      className="btn btn-primary btn-outline"
      onClick={() => {
        setAddMemberOpen(true);
      }}
    >
      <MdPersonAdd />
      Add Participant
    </button>
  );
};
