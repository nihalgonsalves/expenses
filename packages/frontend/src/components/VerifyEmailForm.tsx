import { useNavigate } from "react-router-dom";

import { trpc } from "../api/trpc";

import { SingleScreenCard } from "./SignInForm";
import { Button } from "./ui/button";
import { CardContent, CardHeader, CardTitle } from "./ui/card";

export const VerifyEmailForm = ({ token }: { token: string }) => {
  const navigate = useNavigate();

  const utils = trpc.useUtils();

  const { mutateAsync: verifyEmail, isLoading } =
    trpc.user.verifyEmail.useMutation();

  const onSubmit = async () => {
    await verifyEmail(token);
    await utils.user.me.invalidate();

    navigate("/settings");
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
          isLoading={isLoading}
        >
          Confirm email verification
        </Button>
      </CardContent>
    </SingleScreenCard>
  );
};
