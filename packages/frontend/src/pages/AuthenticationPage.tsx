import { Navigate, useMatch, useSearchParams } from "react-router";

import { useCurrentUser } from "../api/useCurrentUser";
import { SignInForm } from "../components/SignInForm";
import { SignUpForm } from "../components/SignUpForm";

import { Root } from "./Root";

const AuthenticationPage = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = useMatch("/auth/sign-up");

  const { data, error } = useCurrentUser();

  if (data?.id && !error) {
    const redirect = searchParams.get("redirect");

    return <Navigate to={redirect ?? "/"} replace />;
  }

  return (
    <Root title={isSignUp ? "Sign up" : "Sign in"} className="p-0 sm:p-5">
      <div className="m-auto size-full sm:grid sm:max-w-xl sm:place-items-center">
        {isSignUp ? <SignUpForm /> : <SignInForm />}
      </div>
    </Root>
  );
};

export default AuthenticationPage;
