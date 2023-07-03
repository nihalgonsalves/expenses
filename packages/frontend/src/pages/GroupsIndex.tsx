import { Group } from '@mui/icons-material';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material';

import { useGroups } from '../db/splitGroup';
import { RouterLink } from '../router';

export const GroupsIndex = () => {
  const groups = useGroups();

  return (
    <List>
      {groups.map((group) => (
        <ListItem key={group.id}>
          <ListItemButton
            LinkComponent={RouterLink}
            href={`/groups/${group.id}`}
          >
            <ListItemAvatar>
              <Avatar>
                <Group />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={group.name}
              secondary={[group.owner, ...group.participants]
                .map(({ name }) => name)
                .join(', ')}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};
