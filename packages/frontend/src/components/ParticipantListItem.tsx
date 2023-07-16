import { Person } from '@mui/icons-material';
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  type SxProps,
} from '@mui/material';

export const ParticipantListItem = ({
  children,
  avatar,
  sx = {},
  disablePadding = true,
}: {
  children: React.ReactNode;
  avatar?: React.ReactNode;
  sx?: SxProps;
  disablePadding?: boolean;
}) => (
  <ListItem sx={sx} disablePadding={disablePadding}>
    <ListItemAvatar>
      <Avatar>{avatar ?? <Person />}</Avatar>
    </ListItemAvatar>
    {children}
  </ListItem>
);

export const ParticipantTextListItem = ({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) => (
  <ParticipantListItem>
    <ListItemText primary={primary} secondary={secondary} />
  </ParticipantListItem>
);
