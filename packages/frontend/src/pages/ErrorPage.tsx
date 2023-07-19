import { Box } from '@mui/material';

import { Root } from './Root';

export const ErrorPage = () => {
  // TODO useRouterError
  return (
    <Root title="Error">
      <Box>Something went wrong </Box>
    </Root>
  );
};
