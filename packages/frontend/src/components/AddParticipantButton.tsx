import { Check, Clear, PersonAdd } from '@mui/icons-material';
import { Button, IconButton, Stack, TextField } from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { trpc } from '../api/trpc';
import { prevalidateEmail } from '../utils/utils';

import { ParticipantListItem } from './ParticipantListItem';

export const AddParticipantButton = ({ groupId }: { groupId: string }) => {
  const { enqueueSnackbar } = useSnackbar();

  const addParticipant = trpc.sheet.addParticipant.useMutation();
  const utils = trpc.useContext();

  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [participantEmail, setParticipantEmail] = useState('');

  const valid = prevalidateEmail(participantEmail);

  const handleClose = () => {
    setAddParticipantOpen(false);
    setParticipantEmail('');
  };

  const handleAddParticipant = async () => {
    try {
      await addParticipant.mutateAsync({ groupId, participantEmail });

      await Promise.all([
        utils.sheet.groupSheetById.invalidate(groupId),
        utils.expense.getParticipantSummaries.invalidate(groupId),
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

  return addParticipantOpen ? (
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
          void handleAddParticipant();
        }}
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Participant's email address"
          disabled={addParticipant.isLoading}
          value={participantEmail}
          onChange={(e) => {
            setParticipantEmail(e.target.value);
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
        setAddParticipantOpen(true);
      }}
    >
      Add Participant
    </Button>
  );
};
