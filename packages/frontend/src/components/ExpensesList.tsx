import { MoreVert, QuestionMark } from '@mui/icons-material';
import {
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Menu,
  MenuItem,
  Stack,
  Typography,
  type SxProps,
} from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useId, useState } from 'react';

import { type GetExpensesResponse } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { categoryById } from '../data/categories';
import { formatCurrency } from '../utils/money';
import { formatDateTime, joinList } from '../utils/utils';

const ExpenseMenu = ({
  groupId,
  expense,
  setIsInvalidating,
}: {
  groupId: string;
  expense: GetExpensesResponse[number];
  setIsInvalidating: (isInvalidating: boolean) => void;
}) => {
  const buttonId = useId();
  const menuId = useId();

  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();
  const deleteExpense = trpc.expense.deleteExpense.useMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = anchorEl != null;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      handleMenuClose();
      setIsInvalidating(true);

      await deleteExpense.mutateAsync({ groupId, expenseId: expense.id });

      await Promise.all([
        utils.expense.getExpenses.invalidate({ groupId }),
        utils.expense.getParticipantSummaries.invalidate(groupId),
      ]);
    } catch (e) {
      setIsInvalidating(false);
      enqueueSnackbar(
        `Error deleting expense: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
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
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            return handleDelete();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
};

const ExpenseListItem = ({
  expense,
  groupId,
  showActions,
}: {
  expense: GetExpensesResponse[number];
  groupId: string;
  showActions: boolean;
}) => {
  const [isInvalidating, setIsInvalidating] = useState(false);

  return (
    <ListItem
      sx={{ opacity: isInvalidating ? 0.5 : 'unset', paddingInline: 0 }}
    >
      <ListItemAvatar>
        <Avatar>
          {categoryById[expense.category]?.icon ?? <QuestionMark />}
        </Avatar>
      </ListItemAvatar>
      <Stack direction="row" gap={1} style={{ width: '100%' }}>
        <div>
          <Typography variant="body2">
            {expense.description || categoryById[expense.category]?.name}
          </Typography>
          <Typography variant="body2" color="grey">
            {[
              joinList(expense.paidBy.map(({ name }) => name)),
              ' paid for ',
              joinList(expense.paidFor.map(({ name }) => name)),
            ]}
          </Typography>
        </div>
        <div style={{ flexGrow: 1 }} />
        <div style={{ textAlign: 'right' }}>
          <Typography variant="body2">
            {formatCurrency(expense.money)}
          </Typography>
          <Typography variant="body2" color="grey">
            {formatDateTime(expense.spentAt)}
          </Typography>
        </div>
        {showActions && (
          <ExpenseMenu
            groupId={groupId}
            expense={expense}
            setIsInvalidating={setIsInvalidating}
          />
        )}
      </Stack>
    </ListItem>
  );
};

export const ExpensesList = ({
  groupId,
  expenses,
  sx = {},
  showActions = false,
}: {
  groupId: string;
  expenses: GetExpensesResponse;
  sx?: SxProps;
  showActions?: boolean;
}) => {
  return (
    <List sx={sx} dense>
      {expenses.map((expense) => (
        <ExpenseListItem
          key={expense.id}
          expense={expense}
          groupId={groupId}
          showActions={showActions}
        />
      ))}
    </List>
  );
};
