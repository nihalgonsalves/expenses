import { Group, Settings } from '@mui/icons-material';
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

      <Box
        display="flex"
        flexDirection="column"
        flexGrow={1}
        padding={2}
        position="relative"
        sx={{ overflowY: 'auto' }}
      >
        <Outlet />
      </Box>

      <BottomNavigation
        sx={{ flexShrink: 0, backgroundColor: '#f1f1f1' }}
        showLabels
        value="Expenses"
      >
        <BottomNavigationAction
          label="Groups"
          icon={<Group />}
          LinkComponent={RouterLink}
          href="/groups"
        />
        <BottomNavigationAction label="Setings" icon={<Settings />} />
      </BottomNavigation>
    </Stack>
  );
};