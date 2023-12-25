import { CheckIcon, Cross2Icon, PersonIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { prevalidateEmail } from '../../utils/utils';
import { Avatar } from '../Avatar';
import { Button } from '../form/Button';
import { TextField } from '../form/TextField';

import { ParticipantListItem } from './ParticipantListItem';

export const AddMemberButton = ({ groupSheetId }: { groupSheetId: string }) => {
  const onLine = useNavigatorOnLine();

  const { mutateAsync: addGroupSheetMember, isLoading } =
    trpc.sheet.addGroupSheetMember.useMutation();
  const utils = trpc.useUtils();

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
      utils.transaction.getParticipantSummaries.invalidate(groupSheetId),
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
          <Cross2Icon />
        </Button>

        <Button
          className="btn-square"
          type="submit"
          aria-label="Add"
          disabled={!valid}
        >
          <CheckIcon />
        </Button>
      </form>
    </ParticipantListItem>
  ) : (
    <Button
      className="btn-primary btn-outline"
      disabled={!onLine}
      onClick={() => {
        setAddMemberOpen(true);
      }}
    >
      <PersonIcon />
      Add Participant
    </Button>
  );
};
