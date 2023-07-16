import { DeleteOutline, ListAlt, PlaylistAdd } from '@mui/icons-material';
import {
  Button,
  Card,
  CardContent,
  List,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { type GroupByIdResponse } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { RouterLink } from '../router';
import { formatCurrency } from '../utils/money';

import { AddParticipantButton } from './AddParticipantButton';
import { ExpensesList } from './ExpensesList';
import { ParticipantListItem } from './ParticipantListItem';

export const Group = ({ group }: { group: GroupByIdResponse }) => {
  const navigate = useNavigate();

  const { data: expenses } = trpc.expense.getExpenses.useQuery({
    groupId: group.id,
    limit: 2,
  });

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
            {summaries?.map(({ participantId, name, balance }) => (
              <ParticipantListItem key={participantId}>
                <ListItemText
                  primary={name}
                  secondary={
                    <>
                      {(() => {
                        if (balance.amount === 0) {
                          return 'Settled up';
                        }

                        const amount = formatCurrency({
                          ...balance,
                          amount: Math.abs(balance.amount),
                        });

                        if (balance.amount > 0) {
                          return `owes ${amount}`;
                        } else {
                          return `is owed ${amount}`;
                        }
                      })()}
                    </>
                  }
                  secondaryTypographyProps={{
                    sx: { display: 'flex', alignItems: 'center' },
                  }}
                />
              </ParticipantListItem>
            ))}
          </List>

          <AddParticipantButton groupId={group.id} />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Latest Expenses</Typography>
          <ExpensesList groupId={group.id} expenses={expenses ?? []} />
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<ListAlt />}
              LinkComponent={RouterLink}
              href={`/groups/${group.id}/expenses`}
            >
              All Expenses ({expenses?.length})
            </Button>
            <Button
              fullWidth
              variant="contained"
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
            onClick={handleDelete}
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
