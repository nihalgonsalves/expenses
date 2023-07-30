import { ListAlt, PlaylistAdd } from '@mui/icons-material';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';

import { RouterLink } from '../router';

export const LatestExpensesCard = ({
  children,
  total,
  allExpensesPath,
  addExpensePath,
}: {
  children: React.ReactNode;
  total: number | undefined;
  allExpensesPath: string;
  addExpensePath: string;
}) => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h6">Latest Expenses</Typography>
      {children}
      <Stack spacing={1}>
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          startIcon={<ListAlt />}
          LinkComponent={RouterLink}
          href={allExpensesPath}
        >
          All Expenses ({total})
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<PlaylistAdd />}
          LinkComponent={RouterLink}
          href={addExpensePath}
        >
          Add Expense
        </Button>
      </Stack>
    </CardContent>
  </Card>
);
