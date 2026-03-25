import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useTRPC } from "../../api/trpc";
import { useInvalidateRouter } from "../../api/use-invalidate-router";
import { useNavigatorOnLine } from "../../state/use-navigator-on-line";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const PrivacyForm = () => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const [isReconfirming, setIsReconfirming] = useState(false);

  const invalidateRouter = useInvalidateRouter();
  const { trpc } = useTRPC();
  const { mutateAsync: anonymizeUser, isPending } = useMutation(
    trpc.user.anonymizeUser.mutationOptions(),
  );

  const handleAnonymize = async () => {
    if (!isReconfirming) {
      setIsReconfirming(true);
      return;
    }

    await anonymizeUser();

    await invalidateRouter();
    await navigate({ to: "/" });
  };

  const disabled = !onLine;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy and Data</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-sm">
          <p>
            You may delete all personal sheets and transactions, as well as
            anonymize your name and email address.
          </p>
          <p>
            If you would like to delete or leave any groups, please do this{" "}
            <strong>before</strong> anonymising your account. Note that the
            anonymized account will remain linked to any remaining groups as a
            Deleted User.
          </p>
          <p>
            You can sign up with the same email address at any point in the
            future, but this action <strong>cannot</strong> be undone.
          </p>
        </div>
        <Button
          isLoading={isPending}
          disabled={disabled}
          onClick={handleAnonymize}
          variant="destructive"
          className="w-full"
        >
          {isReconfirming ? "Are you sure?" : "Anonymise your account"}
        </Button>
      </CardContent>
    </Card>
  );
};
