import { AddCircle, DeleteOutline, PersonAdd } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import { produce } from 'immer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { getCurrencyCode } from '../utils/money';
import { prevalidateEmail } from '../utils/utils';

import { CurrencySelect } from './CurrencySelect';

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
    <form>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error.message}</Alert>}

        <TextField
          fullWidth
          label="Group name"
          placeholder="WG Expenses"
          required
          value={groupSheetName}
          onChange={(e) => {
            setGroupSheetName(e.target.value);
          }}
        />

        <CurrencySelect
          fullWidth
          currencyCode={currencyCode}
          setCurrencyCode={setCurrencyCode}
        />

        {participantEmails.map((participant, i) => (
          // this is a list of inputs without an ID that won't be re-ordered
          // eslint-disable-next-line react/no-array-index-key
          <Stack key={i} direction="row" spacing={1}>
            <TextField
              fullWidth
              label={`Person ${i + 1}'s email address`}
              value={participant}
              required
              onChange={(e) => {
                handleChangeParticipant(i, e.target.value);
              }}
              InputProps={{
                endAdornment: (
                  <IconButton
                    aria-label="Delete"
                    onClick={() => {
                      handleDeleteParticipant(i);
                    }}
                    color="error"
                  >
                    <DeleteOutline />
                  </IconButton>
                ),
              }}
            />
          </Stack>
        ))}

        <Button
          fullWidth
          variant="outlined"
          startIcon={<PersonAdd />}
          onClick={handleAddParticipant}
        >
          Add Participant
        </Button>

        <Divider />

        <LoadingButton
          fullWidth
          variant="contained"
          startIcon={<AddCircle />}
          onClick={handleCreateGroupSheet}
          disabled={!valid}
          loading={isLoading}
        >
          Create Group
        </LoadingButton>
      </Stack>
    </form>
  );
};
