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
  sx = {},
}: {
  children: React.ReactNode;
  sx?: SxProps;
}) => (
  <ListItem sx={sx}>
    <ListItemAvatar>
      <Avatar>
        <Person />
      </Avatar>
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