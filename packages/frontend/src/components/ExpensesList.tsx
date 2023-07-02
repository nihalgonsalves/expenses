import { Add, Restaurant } from '@mui/icons-material';
import {
  Avatar,
  Divider,
  Fab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from '@mui/material';
import { Fragment } from 'react';

import { RouterLink } from '../router';
import { getUserLanguage } from '../utils';

export const ExpensesList = () => {
  return (
    <>
      <List dense>
        {Array.from({ length: 50 }).map((_, i) => (
          // test data
          <Fragment key={i}>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <Restaurant />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack direction="row" justifyContent="space-between">
                    <span>Food</span>
                    <span>
                      {new Intl.NumberFormat(getUserLanguage(), {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(-12.34)}
                    </span>
                  </Stack>
                }
                secondary="Pizza"
              />
            </ListItem>

            <Divider />
          </Fragment>
        ))}
      </List>
      <Fab
        color="primary"
        aria-label="Add"
        sx={{ position: 'sticky', bottom: 0, right: 0 }}
        LinkComponent={RouterLink}
        href="/expenses/new"
      >
        <Add />
      </Fab>
    </>
  );
};
