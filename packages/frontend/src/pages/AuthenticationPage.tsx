import { Navigate, useMatch, useSearchParams } from "react-router-dom";

import { useCurrentUser } from "../api/useCurrentUser";
import { SignInForm, SignUpForm } from "../components/AuthenticationForm";

import { Root } from "./Root";

export const AuthenticationPage = () => {
  const [searchParams] = useSearchParams();
  const isSignUp = useMatch("/auth/sign-up");

  const { data, error } = useCurrentUser();

  if (data?.id && !error) {
    const redirect = searchParams.get("redirect");

    return <Navigate to={redirect ?? "/"} replace />;
  }

  return (
    <Root
      title={isSignUp ? "Sign up" : "Sign in"}
      className="m-auto p-0 sm:grid sm:max-w-xl sm:place-items-center sm:p-5"
    >
      {isSignUp ? <SignUpForm /> : <SignInForm />}
    </Root>
  );
};
