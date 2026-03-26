import { createFileRoute, Link, useRouter } from "@tanstack/react-router";

import { useCurrentUser } from "../api/use-current-user";
import { AppearanceForm } from "../components/settings/appearance-form";
import { CategoryForm } from "../components/settings/category-form";
import { NotificationPreferenceForm } from "../components/settings/notification-preference-form";
import { PrivacyForm } from "../components/settings/privacy-form";
import { TroubleshootingForm } from "../components/settings/troubleshooting-form";
import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { Root } from "../pages/root";
import {
  ChangeEmailCard,
  PasskeysCard,
  ProvidersCard,
  UpdateNameCard,
} from "@daveyplate/better-auth-ui";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { useState } from "react";
import { authClient } from "#/utils/auth";

export const Route = createFileRoute("/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
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
      component: (
        <>
          <UpdateNameCard />
          <ChangeEmailCard />
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
      title: "Security",
      component: (
        <>
          <PasskeysCard />
          {config?.hasOauth && <ProvidersCard />}
        </>
      ),
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
        <AuthQueryProvider>
          <AuthUIProviderTanstack
            passkey
            magicLink
            authClient={authClient}
            {...(config?.hasOauth && {
              genericOAuth: { providers: config.oauthProviders },
            })}
            navigate={async (href) => router.navigate({ href })}
            replace={async (href) => router.navigate({ href, replace: true })}
            Link={({ href, ...props }) => <Link to={href} {...props} />}
          >
            {sectionById.get(selectedSection)?.component ?? null}
          </AuthUIProviderTanstack>
        </AuthQueryProvider>
      </div>
    </Root>
  );
}
