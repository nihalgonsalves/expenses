import { useCurrentUser } from '../api/useCurrentUser';
import { DeleteUserForm } from '../components/settings/DeleteUserForm';
import { NotificationPreferenceForm } from '../components/settings/NotificationPreferenceForm';
import { PreferencesForm } from '../components/settings/PreferencesForm';
import { ProfileForm } from '../components/settings/ProfileForm';
import { ThemeForm } from '../components/settings/ThemeForm';
import { TroubleshootingForm } from '../components/settings/TroubleshootingForm';

import { Root } from './Root';

export const SettingsPage = () => {
  const { data, status } = useCurrentUser();

  return (
    <Root title="Settings">
      <div className="flex flex-col gap-8">
        <PreferencesForm />
        <ThemeForm />
        {status === 'success' && (
          <>
            <ProfileForm me={data} />
            <NotificationPreferenceForm />
            <DeleteUserForm />
          </>
        )}
        <TroubleshootingForm />
      </div>
    </Root>
  );
};
