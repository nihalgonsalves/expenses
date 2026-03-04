// oxlint-disable-next-line import/no-duplicates
import "@khmyznikov/pwa-install";
import type { PWAInstallElement } from "@khmyznikov/pwa-install";
import { useOs, type UseOSReturnValue } from "@mantine/hooks";
import { atom, useSetAtom } from "jotai";

const getOsText = (os: UseOSReturnValue) => {
  switch (os) {
    case "macos":
      return "Add this web app to your Dock for quick access and a better experience.";
    case "ios":
      return "Add this web app to your Home Screen for quick access and push notification support.";

    case "android":
    case "chromeos":
    case "linux":
    case "windows":
    case "undetermined":
    default:
      return "This web app can be installed for offline support and a better experience.";
  }
};

export const pwaInstallElementAtom = atom<PWAInstallElement | null>(null);

export const PWAInstall = () => {
  const os = useOs();
  const setPwaInstallElement = useSetAtom(pwaInstallElementAtom);

  return (
    <pwa-install
      ref={(element) => {
        setPwaInstallElement(element);

        return () => {
          setPwaInstallElement(null);
        };
      }}
      styles={{
        "--tint-color": "var(--primary)",
      }}
      manifestUrl="/api/manifest.webmanifest"
      name="Expenses"
      description="Shared expense tracking app with personal and shared sheets"
      installDescription={getOsText(os)}
    />
  );
};
