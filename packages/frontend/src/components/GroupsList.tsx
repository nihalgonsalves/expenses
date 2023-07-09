import { Group } from '@mui/icons-material';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  type SxProps,
} from '@mui/material';

import { type SplitGroup } from '../db/types';
import { RouterLink } from '../router';

export const GroupsList = ({
  groups,
  sx = {},
}: {
  groups: SplitGroup[];
  sx?: SxProps;
}) => {
  return (
    <List sx={sx}>
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
