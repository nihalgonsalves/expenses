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

import { type GroupSheetsResponse } from '@nihalgonsalves/expenses-backend';

import { RouterLink } from '../router';

export const GroupSheetsList = ({
  groups,
  sx = {},
}: {
  groups: GroupSheetsResponse;
  sx?: SxProps;
}) => {
  return (
    <List sx={sx}>
      {groups.map((group) => (
        <ListItem key={group.id} disablePadding>
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
              primaryTypographyProps={{ color: 'text.primary' }}
              secondary={group.participants.map(({ name }) => name).join(', ')}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};
