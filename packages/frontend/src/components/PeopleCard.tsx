import { Info } from '@mui/icons-material';
import {
  Card,
  CardContent,
  IconButton,
  List,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import { useId, useState } from 'react';

import { type Money } from '@nihalgonsalves/expenses-backend';

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

const PersonMenu = ({ spent, cost }: { spent: Money; cost: Money }) => {
  const buttonId = useId();
  const menuId = useId();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = anchorEl != null;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
        <Info />
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
        <InfoMenuItem label="Spent for group:">
          {formatCurrency(spent)}
        </InfoMenuItem>
        <InfoMenuItem label="Cost to group:">
          {formatCurrency(cost)}
        </InfoMenuItem>
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

export const PeopleCard = ({ groupId }: { groupId: string }) => {
  const { data: summaries } =
    trpc.expense.getParticipantSummaries.useQuery(groupId);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">People</Typography>

        <List>
          {summaries?.map(({ participantId, name, balance, spent, cost }) => (
            <ParticipantListItem key={participantId}>
              <ListItemText
                primary={name}
                secondary={getBalanceText(balance)}
                secondaryTypographyProps={{
                  sx: { display: 'flex', alignItems: 'center' },
                }}
              />
              <PersonMenu spent={spent} cost={cost} />
            </ParticipantListItem>
          ))}
        </List>

        <AddParticipantButton groupId={groupId} />
      </CardContent>
    </Card>
  );
};
