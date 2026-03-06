import type { Theme } from "@nihalgonsalves/expenses-shared/types/theme";
import { useAtomValue } from "jotai";
import { pwaInstallElementAtom } from "../PWAInstall";
import { Button } from "../ui/button";
import { useIsStandalone } from "#/utils/hooks/useIsStandalone";
import { DownloadIcon } from "lucide-react";

export const IconPreview = ({ theme }: { theme: Theme }) => {
  const isStandalone = useIsStandalone();
  const pwaInstallElement = useAtomValue(pwaInstallElementAtom);

  return (
    <div className="bg-muted grid grow place-items-center rounded-lg text-center align-middle">
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-sm tracking-tight">
          <img
            className="size-20"
            src={`/assets/icon-normal-${theme}.svg`}
            alt="icon"
          />
          Expenses
        </div>
        {pwaInstallElement && (
          <Button
            disabled={isStandalone}
            onClick={() => {
              pwaInstallElement.showDialog();
            }}
          >
            <DownloadIcon />
            Install web app
          </Button>
        )}
      </div>
    </div>
  );
};
