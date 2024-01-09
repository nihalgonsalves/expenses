import { useCurrentUser } from "../api/useCurrentUser";
import { AppearanceForm } from "../components/settings/AppearanceForm";
import { CategoryForm } from "../components/settings/CategoryForm";
import { NotificationPreferenceForm } from "../components/settings/NotificationPreferenceForm";
import { PrivacyForm } from "../components/settings/PrivacyForm";
import { ProfileForm } from "../components/settings/ProfileForm";
import { TroubleshootingForm } from "../components/settings/TroubleshootingForm";

import { Root } from "./Root";

export const SettingsPage = () => {
  const { data, status } = useCurrentUser();

  return (
    <Root title="Settings" className="p-2 md:p-5" showBackButton>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {status === "success" && (
          <>
            <AppearanceForm />
            <ProfileForm me={data} />
            <CategoryForm />
            <NotificationPreferenceForm />
            <PrivacyForm />
          </>
        )}
        <TroubleshootingForm />
      </div>
    </Root>
  );
};
