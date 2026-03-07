import { createFileRoute } from "@tanstack/react-router";

import { useCurrentUser } from "../api/useCurrentUser";
import { AppearanceForm } from "../components/settings/AppearanceForm";
import { CategoryForm } from "../components/settings/CategoryForm";
import { NotificationPreferenceForm } from "../components/settings/NotificationPreferenceForm";
import { PrivacyForm } from "../components/settings/PrivacyForm";
import { TroubleshootingForm } from "../components/settings/TroubleshootingForm";
import { Root } from "../pages/Root";
import {
  ChangeEmailCard,
  ChangePasswordCard,
  PasskeysCard,
  SessionsCard,
  UpdateNameCard,
} from "@daveyplate/better-auth-ui";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { useState } from "react";
import { VerifyEmailCard } from "#/components/settings/VerifyEmailCard";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedSection, setSelectedSection] = useState<Section>("Profile");

  const me = useCurrentUser();

  if (!me) {
    return (
      <Root title="Settings" className="p-2 md:p-5" showBackButton>
        <TroubleshootingForm />
      </Root>
    );
  }

  const sections = [
    {
      title: "Profile",
      component: (
        <>
          <UpdateNameCard />
          <VerifyEmailCard me={me} />
        </>
      ),
    },
    { title: "Appearance", component: <AppearanceForm /> },
    { title: "Categories", component: <CategoryForm /> },
    {
      title: "Notification Preferences",
      component: <NotificationPreferenceForm />,
    },
    {
      title: "Email",
      component: (
        <>
          <ChangeEmailCard />
          <VerifyEmailCard me={me} />
        </>
      ),
    },
    { title: "Password", component: <ChangePasswordCard /> },
    { title: "Passkeys", component: <PasskeysCard /> },
    { title: "Sessions", component: <SessionsCard /> },
    { title: "Privacy", component: <PrivacyForm /> },
    { title: "Troubleshooting", component: <TroubleshootingForm /> },
  ] as const;

  const sectionById = new Map(
    sections.map((section) => [section.title, section]),
  );

  type Section = (typeof sections)[number]["title"];

  return (
    <Root title="Settings" className="p-2 md:p-5" showBackButton>
      <div className="flex flex-col gap-4">
        <NativeSelect
          className="w-full"
          onChange={(event) => {
            const section = sectionById.get(
              // oxlint-disable-next-line typescript/no-unsafe-type-assertion
              event.target.value as Section,
            );

            if (section) {
              setSelectedSection(section.title);
            }
          }}
          value={selectedSection}
        >
          {sections.map((section) => (
            <NativeSelectOption key={section.title} value={section.title}>
              {section.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {sectionById.get(selectedSection)?.component ?? null}
      </div>
    </Root>
  );
}
