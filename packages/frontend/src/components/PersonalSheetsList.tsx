import { ListAlt } from '@mui/icons-material';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  type SxProps,
} from '@mui/material';

import { type Sheet } from '@nihalgonsalves/expenses-backend';

import { RouterLink } from '../router';

export const PersonalSheetsList = ({
  sheets,
  sx = {},
}: {
  sheets: Sheet[];
  sx?: SxProps;
}) => {
  return (
    <List sx={sx}>
      {sheets.map((sheet) => (
        <ListItem key={sheet.id} disablePadding>
          <ListItemButton
            LinkComponent={RouterLink}
            href={`/sheets/${sheet.id}`}
          >
            <ListItemAvatar>
              <Avatar>
                <ListAlt />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={sheet.name}
              secondary={sheet.currencyCode}
              primaryTypographyProps={{ color: 'text.primary' }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};
