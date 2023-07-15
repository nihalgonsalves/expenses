import { DeleteOutline, ListAlt, PlaylistAdd } from '@mui/icons-material';
import {
  Button,
  Card,
  CardContent,
  List,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type GroupByIdResponse } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { RouterLink } from '../router';
import { formatCurrency } from '../utils/money';

import { ExpensesList } from './ExpensesList';
import { ParticipantTextListItem } from './ParticipantListItem';

export const Group = ({ group }: { group: GroupByIdResponse }) => {
  const navigate = useNavigate();

  const { data: expenses } = trpc.expense.getExpenses.useQuery(group.id);
  const { data: summaries } = trpc.expense.getParticipantSummaries.useQuery(
    group.id,
  );

  const deleteGroup = trpc.group.deleteGroup.useMutation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync(group.id);
      navigate('/groups');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">People</Typography>
          <List>
            {summaries?.map(({ participantId, name, spent, cost, balance }) => (
              <ParticipantTextListItem
                key={participantId}
                primary={name}
                secondary={`Spent ${formatCurrency(
                  spent,
                )}, Cost ${formatCurrency(cost)}, Balance ${formatCurrency(
                  balance,
                )}`}
              />
            ))}
          </List>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Expenses (0)</Typography>
          {/* TODO: order/limit */}
          <ExpensesList expenses={expenses ?? []} />
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<ListAlt />}
              LinkComponent={RouterLink}
              href={`/groups/${group.id}/expenses`}
            >
              All Expenses
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<PlaylistAdd />}
              LinkComponent={RouterLink}
              href={`/groups/${group.id}/expenses/new`}
            >
              Add Expense
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {deleteConfirm ? (
        <Stack direction="column" spacing={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => void handleDelete()}
          >
            Confirm Delete (Irreversible)
          </Button>
        </Stack>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => setDeleteConfirm(true)}
        >
          Delete Group
        </Button>
      )}
    </Stack>
  );
};
