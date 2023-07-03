import { AddCircle, DeleteOutline, PersonAdd } from '@mui/icons-material';
import {
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

import { createGroup } from '../db/splitGroup';

type InputParticipant = { name: string };

const blankParticipant: InputParticipant = { name: '' };

export const CreateGroupForm = () => {
  const currencySelectId = useId();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('EUR');

  const [participants, setParticipants] = useState([
    blankParticipant,
    blankParticipant,
  ]);

  const handleAddParticipant = () => {
    setParticipants((prev) => [...prev, blankParticipant]);
  };

  const handleChangeParticipant = (
    index: number,
    field: keyof InputParticipant,
    value: string,
  ) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  const handleDeleteParticipant = (index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateGroup = async () => {
    const [owner, ...others] = participants;

    if (!owner) {
      return;
    }

    const { id } = await createGroup({
      name: groupName,
      currency,
      owner,
      participants: others,
    });

    navigate(`/groups/${id}`);
  };

  const valid = groupName && participants.every((p) => p.name);

  return (
    <form>
      <Stack spacing={3}>
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
            <MenuItem value="EUR">Euro (EUR, €)</MenuItem>
          </Select>
        </FormControl>

        <Divider />

        {participants.map((participant, i) => (
          // this is a list of inputs without an ID that won't be re-ordered
          // eslint-disable-next-line react/no-array-index-key
          <Stack key={i} direction="row" spacing={1}>
            <TextField
              fullWidth
              label={i === 0 ? 'Your Name' : `Person ${i}'s name`}
              value={participant.name}
              required
              onChange={(e) => {
                handleChangeParticipant(i, 'name', e.target.value);
              }}
              InputProps={{
                endAdornment: i > 1 && (
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
