import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useCurrentUser } from "../api/use-current-user";
import { AppearanceForm } from "../components/settings/appearance-form";
import { CategoryForm } from "../components/settings/category-form";
import { NotificationPreferenceForm } from "../components/settings/notification-preference-form";
import { PrivacyForm } from "../components/settings/privacy-form";
import { ProfileForm } from "../components/settings/profile-form";
import { SecurityForm } from "../components/settings/security-form";
import { TroubleshootingForm } from "../components/settings/troubleshooting-form";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { Root } from "../pages/root";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { config } = Route.useRouteContext();
  const [selectedSection, setSelectedSection] = useState<Section>("Profile");

  const me = useCurrentUser();

  if (!me) {
    return (
      <Root title="Settings" showBackButton>
        <TroubleshootingForm />
      </Root>
    );
  }

  const sections = [
    {
      title: "Profile",
      component: <ProfileForm />,
    },
    { title: "Appearance", component: <AppearanceForm /> },
    { title: "Categories", component: <CategoryForm /> },
    {
      title: "Notification Preferences",
      component: <NotificationPreferenceForm />,
    },
    {
      title: "Security",
      component: <SecurityForm config={config} />,
    },
    { title: "Privacy", component: <PrivacyForm /> },
    { title: "Troubleshooting", component: <TroubleshootingForm /> },
  ] as const;

  const sectionById = new Map(
    sections.map((section) => [section.title, section]),
  );

  type Section = (typeof sections)[number]["title"];

  return (
    <Root title="Settings" showBackButton>
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
