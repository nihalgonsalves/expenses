import { Card, CardContent } from '@mui/material';

import { trpc } from '../api/trpc';
import { ProfileForm } from '../components/ProfileForm';

export const SettingsPage = () => {
  const { data } = trpc.user.me.useQuery();

  return (
    <Card variant="outlined">
      <CardContent>{data && <ProfileForm me={data} />}</CardContent>
    </Card>
  );
};
