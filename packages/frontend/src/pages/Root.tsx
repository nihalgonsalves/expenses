import {
  ArrowBack,
  Group,
  ListAlt,
  Settings,
  TableView,
} from '@mui/icons-material';
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

const GRADIENT_BACKGROUND = `
  linear-gradient(
    270deg,
    hsl(327deg 100% 43%) 0%,
    hsl(325deg 100% 40%) 16%,
    hsl(323deg 100% 38%) 24%,
    hsl(320deg 100% 36%) 30%,
    hsl(317deg 100% 33%) 35%,
    hsl(314deg 100% 31%) 40%,
    hsl(310deg 100% 28%) 45%,
    hsl(306deg 100% 26%) 50%,
    hsl(301deg 100% 23%) 55%,
    hsl(295deg 100% 22%) 60%,
    hsl(289deg 100% 22%) 65%,
    hsl(283deg 100% 21%) 70%,
    hsl(275deg 95% 21%) 76%,
    hsl(266deg 91% 20%) 84%,
    hsl(254deg 88% 20%) 100%
  )
`;

const STANDALONE_AWARE_BG = {
  backgroundImage: GRADIENT_BACKGROUND,
  backgroundColor: '#1B065E',
  '@media (display-mode: standalone)': {
    backgroundImage: 'none',
  },
};

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
      <AppBar position="static" sx={STANDALONE_AWARE_BG}>
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
          backgroundImage: GRADIENT_BACKGROUND,
          color: theme.palette.getContrastText(theme.palette.primary.main),
          // e.g. bottom nav handle when running on iOS as a PWA
          paddingBottom: 'calc(env(safe-area-inset-bottom) - 1em)',
        })}
        showLabels
        value="Expenses"
      >
        <BottomNavigationAction
          label="Expenses"
          icon={<ListAlt />}
          LinkComponent={RouterLink}
          href="/expenses"
          sx={{ color: 'unset' }}
        />
        <BottomNavigationAction
          label="Sheets"
          icon={<TableView />}
          LinkComponent={RouterLink}
          href="/sheets"
          sx={{ color: 'unset' }}
        />
        <BottomNavigationAction
          label="Groups"
          icon={<Group />}
          LinkComponent={RouterLink}
          href="/groups"
          sx={{ color: 'unset' }}
        />
        <BottomNavigationAction
          label="Setings"
          icon={<Settings />}
          LinkComponent={RouterLink}
          href="/settings"
          sx={{ color: 'unset' }}
        />
      </BottomNavigation>
    </Stack>
  );
};
