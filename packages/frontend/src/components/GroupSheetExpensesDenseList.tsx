import {
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  Stack,
  Typography,
  type SxProps,
} from '@mui/material';

import { type GroupSheetExpenseListItem } from '@nihalgonsalves/expenses-backend';

import { useBreakpointDown } from '../utils/hooks';
import { formatCurrency } from '../utils/money';
import {
  getExpenseDescription,
  getGroupSheetExpenseSummaryText,
  getInitials,
} from '../utils/utils';

import { CategoryAvatar } from './CategoryAvatar';

const DenseExpenseListItem = ({
  expense,
}: {
  expense: GroupSheetExpenseListItem;
}) => {
  const narrowScreen = useBreakpointDown('sm');

  const descriptionText = getExpenseDescription(expense);

  return (
    <ListItem sx={{ paddingInline: 0 }}>
      <Stack direction="row" gap={1} style={{ width: '100%' }}>
        <CategoryAvatar category={expense.category} />
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
            {getGroupSheetExpenseSummaryText(expense)}
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

export const GroupSheetExpensesDenseList = ({
  expenses,
  sx = {},
}: {
  expenses: GroupSheetExpenseListItem[];
  sx?: SxProps;
  expanded?: boolean;
}) => {
  return (
    <List sx={sx} dense>
      {expenses.map((expense) => (
        <DenseExpenseListItem key={expense.id} expense={expense} />
      ))}
    </List>
  );
};
