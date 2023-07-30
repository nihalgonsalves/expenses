import { Check, Clear, PersonAdd } from '@mui/icons-material';
import { Button, IconButton, Stack, TextField } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { trpc } from '../api/trpc';
import { prevalidateEmail } from '../utils/utils';

import { ParticipantListItem } from './ParticipantListItem';

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
    <ParticipantListItem>
      <Stack
        component="form"
        direction="row"
        gap={2}
        sx={{ width: '100%' }}
        onSubmit={(e) => {
          if (!valid) {
            return;
          }

          e.preventDefault();
          void handleAddMember();
        }}
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Participant's email address"
          disabled={isLoading}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />

        <IconButton aria-label="Cancel" onClick={handleClose}>
          <Clear />
        </IconButton>

        <IconButton type="submit" aria-label="Add" disabled={!valid}>
          <Check />
        </IconButton>
      </Stack>
    </ParticipantListItem>
  ) : (
    <Button
      fullWidth
      variant="outlined"
      color="primary"
      startIcon={<PersonAdd />}
      onClick={() => {
        setAddMemberOpen(true);
      }}
    >
      Add Participant
    </Button>
  );
};
