import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { useTRPC } from "../api/trpc";

import { SingleScreenCard } from "./SignInForm";
import { Button } from "./ui/button";
import { CardContent, CardHeader, CardTitle } from "./ui/card";

export const VerifyEmailForm = ({ token }: { token: string }) => {
  const navigate = useNavigate();

  const { trpc, queryClient } = useTRPC();

  const { mutateAsync: verifyEmail, isPending } = useMutation(
    trpc.user.verifyEmail.mutationOptions(),
  );

  const onSubmit = async () => {
    await verifyEmail(token);
    await queryClient.invalidateQueries();

    await navigate({ to: "/settings" });
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
