import { DeleteOutline, ExpandMore, QuestionMark } from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  styled,
  type SxProps,
  type IconButtonProps,
  Button,
} from '@mui/material';
import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { type GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { categoryById } from '../data/categories';
import { useBreakpointDown } from '../utils/hooks';
import { formatCurrency } from '../utils/money';
import {
  formatDateTimeRelative,
  getInitials,
  getShortName,
} from '../utils/utils';

import { ParticipantListItem } from './ParticipantListItem';

const ExpenseActions = ({
  groupSheetId,
  expense,
  setIsInvalidating,
}: {
  groupSheetId: string;
  expense: GroupSheetExpenseListItem;
  setIsInvalidating: (isInvalidating: boolean) => void;
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();
  const deleteExpense = trpc.expense.deleteExpense.useMutation();

  const handleDelete = async () => {
    try {
      setIsInvalidating(true);

      await deleteExpense.mutateAsync({
        groupSheetId: groupSheetId,
        expenseId: expense.id,
      });

      await Promise.all([
        utils.expense.getGroupSheetExpenses.invalidate({
          groupSheetId,
        }),
        utils.expense.getParticipantSummaries.invalidate(groupSheetId),
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

  return deleteConfirm ? (
    <Stack direction="column" spacing={2}>
      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          setDeleteConfirm(false);
        }}
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
      onClick={() => {
        setDeleteConfirm(true);
      }}
    >
      Delete
    </Button>
  );
};

const getSummaryText = (expense: GroupSheetExpenseListItem): string => {
  if (expense.type === 'TRANSFER') {
    // TODO improve API for transfer type
    // This works because of the sorting of + first
    const [to, from] = expense.participants;

    return `${getShortName(to?.name ?? '')} paid ${getShortName(
      from?.name ?? '',
    )}`;
  }

  if (expense.yourBalance.amount === 0) {
    return 'Not involved';
  }

  const balanceFormatted = formatCurrency(expense.yourBalance, {
    signDisplay: 'never',
  });

  const oweOrReceive =
    expense.yourBalance.amount < 0 ? 'You receive' : 'You owe';

  return `${oweOrReceive} ${balanceFormatted}`;
};

const DenseExpenseListItem = ({
  expense,
}: {
  expense: GroupSheetExpenseListItem;
}) => {
  const narrowScreen = useBreakpointDown('sm');

  const descriptionText =
    (expense.description || undefined) ??
    categoryById[expense.category]?.name ??
    expense.category;

  return (
    <ListItem sx={{ paddingInline: 0 }}>
      <Stack direction="row" gap={1} style={{ width: '100%' }}>
        <Avatar
          variant="rounded"
          sx={(theme) => ({ backgroundColor: theme.palette.primary.main })}
          aria-label={categoryById[expense.category]?.name ?? expense.category}
        >
          {categoryById[expense.category]?.icon ?? <QuestionMark />}
        </Avatar>
        <div>
          <Typography variant="body2" color="text.primary">
            <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              // non-standard but does work in all browsers, should
              // be replaced with `lineClamp` eventually
              // https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp
              // https://drafts.csswg.org/css-overflow-4/#propdef-line-clamp
              display: '-webkit-box',
              WebkitLineClamp: '1',
              WebkitBoxOrient: 'vertical',
            }}
          >
            {getSummaryText(expense)}
          </Typography>
        </div>
        <div style={{ flexGrow: 1 }} />
        <AvatarGroup
          spacing={narrowScreen ? 'small' : 'medium'}
          max={narrowScreen ? 2 : 10}
        >
          {expense.participants
            .filter(({ balance: { amount } }) => amount !== 0)
            .map(({ id, name }) => (
              <Avatar key={id} aria-label={name}>
                {getInitials(name)}
              </Avatar>
            ))}
        </AvatarGroup>
      </Stack>
    </ListItem>
  );
};

type ExpandMoreProps = {
  expand: boolean;
} & IconButtonProps;

const ExpandMoreButton = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ExpandedExpenseListItem = ({
  expense,
  groupSheetId,
}: {
  expense: GroupSheetExpenseListItem;
  groupSheetId: string;
}) => {
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const descriptionText =
    (expense.description || undefined) ??
    categoryById[expense.category]?.name ??
    expense.category;

  const title = (
    <>
      <strong>{descriptionText}</strong> {formatCurrency(expense.money)}
    </>
  );

  const subheader = (
    <>
      {getSummaryText(expense)}
      <br />
      <em>{formatDateTimeRelative(expense.spentAt)}</em>
    </>
  );

  return (
    <ListItem
      sx={{ opacity: isInvalidating ? 0.5 : 'unset', paddingInline: 0 }}
    >
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardHeader
          avatar={
            <Avatar
              sx={(theme) => ({
                backgroundColor: theme.palette.primary.main,
              })}
              variant="rounded"
              aria-label={
                categoryById[expense.category]?.name ?? expense.category
              }
            >
              {categoryById[expense.category]?.icon ?? <QuestionMark />}
            </Avatar>
          }
          action={
            <ExpandMoreButton
              expand={expanded}
              onClick={() => {
                setExpanded((prev) => !prev);
              }}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMore />
            </ExpandMoreButton>
          }
          title={title}
          subheader={subheader}
        />
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent sx={{ paddingBlock: 0 }}>
            {expense.type === 'EXPENSE' && (
              <List dense sx={{ paddingBlockStart: 0 }}>
                {expense.participants
                  .filter(({ balance: { amount } }) => amount !== 0)
                  .map(({ id, name, balance }) => (
                    <ParticipantListItem key={id} avatar={getInitials(name)}>
                      <ListItemText
                        primary={name}
                        secondary={`${
                          balance.amount < 0 ? 'Receives' : 'Owes'
                        } ${formatCurrency(balance, {
                          signDisplay: 'never',
                        })}`}
                      />
                    </ParticipantListItem>
                  ))}
              </List>
            )}
            <ExpenseActions
              groupSheetId={groupSheetId}
              expense={expense}
              setIsInvalidating={setIsInvalidating}
            />
          </CardContent>
        </Collapse>
      </Card>
    </ListItem>
  );
};

export const ExpensesList = ({
  groupSheetId,
  expenses,
  sx = {},
  expanded = false,
}: {
  groupSheetId: string;
  expenses: GroupSheetExpenseListItem[];
  sx?: SxProps;
  expanded?: boolean;
}) => {
  if (expanded) {
    return (
      <List sx={sx}>
        {expenses.map((expense) => (
          <ExpandedExpenseListItem
            key={expense.id}
            expense={expense}
            groupSheetId={groupSheetId}
          />
        ))}
      </List>
    );
  }

  return (
    <List sx={sx} dense>
      {expenses.map((expense) => (
        <DenseExpenseListItem key={expense.id} expense={expense} />
      ))}
    </List>
  );
};
