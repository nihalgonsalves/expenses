import { trpc } from '../api/trpc';
import { DeleteUserForm } from '../components/settings/DeleteUserForm';
import { NotificationPreferenceForm } from '../components/settings/NotificationPreferenceForm';
import { ProfileForm } from '../components/settings/ProfileForm';
import { ThemeForm } from '../components/settings/ThemeForm';

import { Root } from './Root';

export const SettingsPage = () => {
  const { data, status } = trpc.user.me.useQuery();

  return (
    <Root title="Settings">
      <div className="flex flex-col gap-8">
        <ThemeForm />
        {status === 'success' && (
          <>
            <ProfileForm me={data} />
            <NotificationPreferenceForm />
            <DeleteUserForm />
          </>
        )}
      </div>
    </Root>
  );
};
