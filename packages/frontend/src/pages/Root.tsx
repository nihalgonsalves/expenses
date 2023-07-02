import { List, Settings } from '@mui/icons-material';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Outlet } from 'react-router-dom';

import { RouterLink } from '../router';

export const Root = () => {
  return (
    <Stack style={{ height: '100dvh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Expenses
          </Typography>
        </Toolbar>
      </AppBar>

      <Box flexGrow={1} padding={2} position="relative" overflow="scroll">
        <Outlet />
      </Box>

      <BottomNavigation
        sx={{ flexShrink: 0, backgroundColor: '#f1f1f1' }}
        showLabels
        value="Expenses"
      >
        <BottomNavigationAction
          label="Expenses"
          icon={<List />}
          LinkComponent={RouterLink}
          href="/"
        />
        <BottomNavigationAction label="Setings" icon={<Settings />} />
      </BottomNavigation>
    </Stack>
  );
};
