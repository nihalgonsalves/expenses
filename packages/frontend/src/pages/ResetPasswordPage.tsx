import { useSearchParams } from "react-router-dom";

import { ResetPasswordForm } from "../components/ResetPasswordForm";
import { Alert, AlertTitle } from "../components/ui/alert";

import { Root } from "./Root";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <Root
      title="Reset Password"
      className="m-auto p-0 sm:grid sm:max-w-xl sm:place-items-center sm:p-5"
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert $variant="destructive">
          <AlertTitle>Token not found</AlertTitle>
        </Alert>
      )}
    </Root>
  );
};

export default ResetPasswordPage;
