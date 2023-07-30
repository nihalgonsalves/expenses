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
  groupSheets,
  sx = {},
}: {
  groupSheets: GroupSheetsResponse;
  sx?: SxProps;
}) => {
  return (
    <List sx={sx}>
      {groupSheets.map((groupSheet) => (
        <ListItem key={groupSheet.id} disablePadding>
          <ListItemButton
            LinkComponent={RouterLink}
            href={`/groups/${groupSheet.id}`}
          >
            <ListItemAvatar>
              <Avatar>
                <Group />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={groupSheet.name}
              primaryTypographyProps={{ color: 'text.primary' }}
              secondary={groupSheet.participants
                .map(({ name }) => name)
                .join(', ')}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};
