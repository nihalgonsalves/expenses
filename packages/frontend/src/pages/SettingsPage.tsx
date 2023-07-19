import { Card, CardContent } from '@mui/material';

import { trpc } from '../api/trpc';
import { ProfileForm } from '../components/ProfileForm';

import { Root } from './Root';

export const SettingsPage = () => {
  const { data, error } = trpc.user.me.useQuery();

  return (
    <Root title="Settings">
      {error?.data?.httpStatus === 401 ? (
        'You are not signed in'
      ) : (
        <Card variant="outlined">
          <CardContent>{data && <ProfileForm me={data} />}</CardContent>
        </Card>
      )}
    </Root>
  );
};
