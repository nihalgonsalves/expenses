import { AddCircle, DeleteOutline, PersonAdd } from '@mui/icons-material';
import {
  Alert,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { CURRENCY_CODES, getDefaultCurrency } from '../utils/money';
import { prevalidateEmail } from '../utils/utils';

export const CreateGroupForm = () => {
  const currencySelectId = useId();
  const navigate = useNavigate();

  const createGroup = trpc.group.createGroup.useMutation();

  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState(getDefaultCurrency());

  const [participantEmails, setParticipantEmails] = useState<string[]>([]);

  const handleAddParticipant = () => {
    setParticipantEmails((prev) => [...prev, '']);
  };

  const handleChangeParticipant = (index: number, value: string) => {
    setParticipantEmails((prev) =>
      prev.map((p, i) => (i === index ? value : p)),
    );
  };

  const handleDeleteParticipant = (index: number) => {
    setParticipantEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async () => {
    const { id } = await createGroup.mutateAsync({
      name: groupName,
      defaultCurrency: currency,
      additionalParticipantEmailAddresses: participantEmails,
    });

    navigate(`/groups/${id}`);
  };

  const valid =
    groupName && participantEmails.every((e) => prevalidateEmail(e));

  return (
    <form>
      <Stack spacing={3}>
        {createGroup.error && (
          <Alert severity="error">{createGroup.error.message}</Alert>
        )}

        <TextField
          fullWidth
          label="Group name"
          placeholder="WG Expenses"
          required
          value={groupName}
          onChange={(e) => {
            setGroupName(e.target.value);
          }}
        />

        <FormControl fullWidth>
          <InputLabel id={currencySelectId}>Currency</InputLabel>
          <Select
            labelId={currencySelectId}
            value={currency}
            label="Currency"
            required
            onChange={(e) => {
              setCurrency(e.target.value);
            }}
          >
            {CURRENCY_CODES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

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
                    onClick={() => handleDeleteParticipant(i)}
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

        <Button
          fullWidth
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => void handleCreateGroup()}
          disabled={!valid}
        >
          Create Group
        </Button>
      </Stack>
    </form>
  );
};
