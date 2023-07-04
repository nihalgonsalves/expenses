import { Person } from '@mui/icons-material';
import { ListItem, ListItemAvatar, Avatar, ListItemText } from '@mui/material';

export const ParticipantListItem = ({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <Person />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary={primary} secondary={secondary} />
  </ListItem>
);
