import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { z } from "zod";

import { AppearanceForm } from "../../components/settings/appearance-form";
import { CategoryForm } from "../../components/settings/category-form";
import { NotificationPreferenceForm } from "../../components/settings/notification-preference-form";
import { PrivacyForm } from "../../components/settings/privacy-form";
import { ProfileForm } from "../../components/settings/profile-form";
import { SecurityForm } from "../../components/settings/security-form";
import type { SettingsSection } from "../../components/settings/settings-navigation";
import { TroubleshootingForm } from "../../components/settings/troubleshooting-form";

const ZSettingsParams = z.object({
  section: z.enum([
    "profile",
    "appearance",
    "categories",
    "notifications",
    "security",
    "privacy",
    "troubleshooting",
  ]),
});

export const Route = createFileRoute("/settings/$section")({
  params: {
    parse: (params) => ZSettingsParams.parse(params),
  },
  component: RouteComponent,
});

function RouteComponent(): ReactElement {
  const { section } = Route.useParams();
  const { config } = Route.useRouteContext();
  const sections: Record<SettingsSection, ReactElement> = {
    profile: <ProfileForm />,
    appearance: <AppearanceForm />,
    categories: <CategoryForm />,
    notifications: <NotificationPreferenceForm />,
    security: <SecurityForm config={config} />,
    privacy: <PrivacyForm />,
    troubleshooting: <TroubleshootingForm />,
  };

  return sections[section];
}
