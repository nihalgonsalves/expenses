import { createFileRoute } from "@tanstack/react-router";

import { useCurrentUser } from "../api/useCurrentUser";
import { AppearanceForm } from "../components/settings/AppearanceForm";
import { CategoryForm } from "../components/settings/CategoryForm";
import { NotificationPreferenceForm } from "../components/settings/NotificationPreferenceForm";
import { PrivacyForm } from "../components/settings/PrivacyForm";
import { ProfileForm } from "../components/settings/ProfileForm";
import { TroubleshootingForm } from "../components/settings/TroubleshootingForm";
import { Root } from "../pages/Root";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const me = useCurrentUser();

  return (
    <Root title="Settings" className="p-2 md:p-5" showBackButton>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {me != null && (
          <>
            <AppearanceForm />
            <ProfileForm me={me} />
            <CategoryForm />
            <NotificationPreferenceForm />
            <PrivacyForm />
          </>
        )}
        <TroubleshootingForm />
      </div>
    </Root>
  );
}
