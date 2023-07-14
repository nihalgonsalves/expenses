import { AccountCircle, Logout } from '@mui/icons-material';
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { trpc } from '../api/trpc';
import { RouterLink } from '../router';

export const NavBarAvatar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const queryClient = useQueryClient();

  const { data } = trpc.user.me.useQuery();
  const { mutate: signOut } = trpc.user.signOut.useMutation({
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      {data ? (
        <>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={anchorEl != null}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <Avatar sx={{ width: '1.5rem', height: '1.5rem' }} />
              </ListItemIcon>
              {data.name}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => signOut()}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </>
      ) : (
        <>
          <Button
            color="inherit"
            LinkComponent={RouterLink}
            href={`/auth/sign-in`}
          >
            Sign in
          </Button>
          <Button
            color="inherit"
            LinkComponent={RouterLink}
            href={`/auth/sign-up`}
          >
            Sign up
          </Button>
        </>
      )}
    </div>
  );
};
