import { useCurrentUser } from '../api/useCurrentUser';
import { DeleteUserForm } from '../components/settings/DeleteUserForm';
import { NotificationPreferenceForm } from '../components/settings/NotificationPreferenceForm';
import { ProfileForm } from '../components/settings/ProfileForm';
import { ThemeForm } from '../components/settings/ThemeForm';

import { Root } from './Root';

export const SettingsPage = () => {
  const { data, status } = useCurrentUser();

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
