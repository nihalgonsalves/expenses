import { useSearchParams } from "react-router-dom";

import { VerifyEmailForm } from "../components/VerifyEmailForm";
import { Alert, AlertTitle } from "../components/ui/alert";

import { Root } from "./Root";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <Root
      title="Verify Email"
      className="m-auto p-0 sm:grid sm:max-w-xl sm:place-items-center sm:p-5"
    >
      {token ? (
        <VerifyEmailForm token={token} />
      ) : (
        <Alert $variant="destructive">
          <AlertTitle>Token not found</AlertTitle>
        </Alert>
      )}
    </Root>
  );
};

export default VerifyEmailPage;
