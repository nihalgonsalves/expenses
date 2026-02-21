import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useInvalidateRouter } from "#/api/useInvalidateRouter";

import { useTRPC } from "../api/trpc";

import { SingleScreenCard } from "./SignInForm";
import { Button } from "./ui/button";
import { CardContent, CardHeader, CardTitle } from "./ui/card";

export const VerifyEmailForm = ({ token }: { token: string }) => {
  const navigate = useNavigate();

  const { trpc } = useTRPC();
  const invalidateRouter = useInvalidateRouter();

  const { mutateAsync: verifyEmail, isPending } = useMutation(
    trpc.user.verifyEmail.mutationOptions(),
  );

  const onSubmit = async () => {
    await verifyEmail(token);
    await navigate({ to: "/settings" });
    await invalidateRouter();
  };

  return (
    <SingleScreenCard>
      <CardHeader>
        <CardTitle>Verify Email</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={onSubmit}
          type="submit"
          isLoading={isPending}
        >
          Confirm email verification
        </Button>
      </CardContent>
    </SingleScreenCard>
  );
};
