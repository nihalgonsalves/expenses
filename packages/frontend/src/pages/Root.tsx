import { ArrowBack, Group, Settings } from '@mui/icons-material';
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { NavBarAvatar } from '../components/NavBarAvatar';
import { RouterLink } from '../router';

export const Root = ({
  title,
  children,
  showBackButton,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  showBackButton?: boolean;
}) => {
  const navigate = useNavigate();

  return (
    <Stack style={{ height: '100dvh' }}>
      <AppBar position="static">
        <Toolbar>
          {showBackButton && (
            <IconButton
              size="large"
              edge="start"
              aria-label="Back"
              color="inherit"
              onClick={() => {
                navigate(-1);
              }}
            >
              <ArrowBack />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          <NavBarAvatar />
        </Toolbar>
      </AppBar>

      <Box
        display="flex"
        flexDirection="column"
        flexGrow={1}
        padding={2}
        position="relative"
        sx={(theme) => ({
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default,
        })}
      >
        {children}
      </Box>

      <BottomNavigation
        sx={(theme) => ({
          flexShrink: 0,
          backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f1f1f1',
        })}
        showLabels
        value="Expenses"
      >
        <BottomNavigationAction
          label="Groups"
          icon={<Group />}
          LinkComponent={RouterLink}
          href="/groups"
        />
        <BottomNavigationAction
          label="Setings"
          icon={<Settings />}
          LinkComponent={RouterLink}
          href="/settings"
        />
      </BottomNavigation>
    </Stack>
  );
};
