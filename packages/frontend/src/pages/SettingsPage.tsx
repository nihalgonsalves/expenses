import { useCurrentUser } from '../api/useCurrentUser';
import { AppearanceForm } from '../components/settings/AppearanceForm';
import { NotificationPreferenceForm } from '../components/settings/NotificationPreferenceForm';
import { PrivacyForm } from '../components/settings/PrivacyForm';
import { ProfileForm } from '../components/settings/ProfileForm';
import { TroubleshootingForm } from '../components/settings/TroubleshootingForm';

import { Root } from './Root';

export const SettingsPage = () => {
  const { data, status } = useCurrentUser();

  return (
    <Root title="Settings" showBackButton>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AppearanceForm />
        {status === 'success' && (
          <>
            <ProfileForm me={data} />
            <NotificationPreferenceForm />
            <PrivacyForm />
          </>
        )}
        <TroubleshootingForm />
      </div>
    </Root>
  );
};
