import { CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";

import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { Button } from "../ui/button";
import { authClient } from "#/utils/auth";
import { Alert } from "../ui/alert";

export const VerifyEmailCard = ({ me }: { me: User }) =>
  me.emailVerified ? (
    <Alert>
      <span className="flex items-center gap-[1ch]">
        <CheckCircle2Icon className="text-md size-[1em]" /> Email {me.email}{" "}
        verified
      </span>
    </Alert>
  ) : (
    <Alert>
      <Button
        onClick={() => {
          void authClient.sendVerificationEmail(
            {
              email: me.email,
            },
            {
              onSuccess: () => {
                toast.success(
                  "Please check your email for a verification link.",
                );
              },
            },
          );
        }}
        type="button"
        variant="link"
        className="p-0"
      >
        Not verified. Resend verification email?
      </Button>
    </Alert>
  );
