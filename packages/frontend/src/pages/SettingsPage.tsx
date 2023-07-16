import { Card, CardContent } from '@mui/material';

import { trpc } from '../api/trpc';
import { ProfileForm } from '../components/ProfileForm';

export const SettingsPage = () => {
  const { data, error } = trpc.user.me.useQuery();

  return error?.data?.httpStatus === 401 ? (
    'You are not signed in'
  ) : (
    <Card variant="outlined">
      <CardContent>{data && <ProfileForm me={data} />}</CardContent>
    </Card>
  );
};
