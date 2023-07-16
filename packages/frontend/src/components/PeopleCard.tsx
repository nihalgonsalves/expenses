import { DeleteOutline, MoreVert } from '@mui/icons-material';
import {
  Card,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useId, useState } from 'react';

import {
  type Money,
  type ExpenseSummaryResponse,
} from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { formatCurrency } from '../utils/money';

import { AddParticipantButton } from './AddParticipantButton';
import { ParticipantListItem } from './ParticipantListItem';

const InfoMenuItem = ({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) => (
  // TODO: accessibility - shouldn't be an interactive element
  <MenuItem sx={{ display: 'flex', gap: 1 }}>
    <span>{label}</span>
    <span style={{ flexGrow: 1 }} />
    <span>{children}</span>
  </MenuItem>
);

const PersonMenu = ({
  groupId,
  participantId,
  spent,
  cost,
  setIsInvalidating,
}: {
  groupId: string;
  participantId: string;
  spent: Money;
  cost: Money;
  setIsInvalidating: (val: boolean) => void;
}) => {
  const buttonId = useId();
  const menuId = useId();

  const { enqueueSnackbar } = useSnackbar();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = anchorEl != null;

  const utils = trpc.useContext();
  const deleteParticipant = trpc.group.deleteParticipant.useMutation();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    setIsInvalidating(true);

    try {
      await deleteParticipant.mutateAsync({
        groupId,
        participantId,
      });

      await Promise.all([
        utils.group.groupById.invalidate(groupId),
        utils.expense.getParticipantSummaries.invalidate(groupId),
      ]);
    } catch (e) {
      enqueueSnackbar(
        `Error deleting expense: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
    } finally {
      setIsInvalidating(false);
    }
  };

  return (
    <div>
      <IconButton
        aria-label="more"
        id={buttonId}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleMenuClick}
      >
        <MoreVert />
      </IconButton>
      <Menu
        id={menuId}
        MenuListProps={{
          'aria-labelledby': buttonId,
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <InfoMenuItem label="Spent for group">
          {formatCurrency(spent)}
        </InfoMenuItem>
        <InfoMenuItem label="Cost to group">
          {formatCurrency(cost)}
        </InfoMenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteOutline color="error" fontSize="small" />
          </ListItemIcon>
          <Typography color="error">Delete Participant</Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};

const getBalanceText = (balance: Money) => {
  if (balance.amount === 0) {
    return 'Settled up';
  }

  const amount = formatCurrency(balance, {
    signDisplay: 'never',
  });

  if (balance.amount > 0) {
    return `owes ${amount}`;
  } else {
    return `is owed ${amount}`;
  }
};

const SummaryCard = ({
  summary,
  groupId,
}: {
  summary: ExpenseSummaryResponse[number];
  groupId: string;
}) => {
  const [isInvalidating, setIsInvalidating] = useState(false);

  return (
    <ParticipantListItem sx={{ opacity: isInvalidating ? 0.5 : 'unset' }}>
      <ListItemText
        primary={summary.name}
        secondary={getBalanceText(summary.balance)}
        secondaryTypographyProps={{
          sx: { display: 'flex', alignItems: 'center' },
        }}
      />
      <PersonMenu
        groupId={groupId}
        participantId={summary.participantId}
        spent={summary.spent}
        cost={summary.cost}
        setIsInvalidating={setIsInvalidating}
      />
    </ParticipantListItem>
  );
};

export const PeopleCard = ({ groupId }: { groupId: string }) => {
  const { data: summaries } =
    trpc.expense.getParticipantSummaries.useQuery(groupId);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">People</Typography>

        <List>
          {summaries?.map((summary) => (
            <SummaryCard
              key={summary.participantId}
              groupId={groupId}
              summary={summary}
            />
          ))}
        </List>

        <AddParticipantButton groupId={groupId} />
      </CardContent>
    </Card>
  );
};