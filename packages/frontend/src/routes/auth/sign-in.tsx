import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Root } from "../../pages/root";
import {
  useEffect,
  useEffectEvent,
  useId,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { authClient } from "#/utils/auth";
import { useInvalidateRouter } from "#/api/use-invalidate-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "#/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import { FingerprintPatternIcon, MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.email(),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Must be a 6-digit numeric code"),
});

export const Route = createFileRoute("/auth/sign-in")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().min(1).optional().catch(undefined),
  }),
  beforeLoad: ({ context: { user }, search }) => {
    if (user != null) {
      throw redirect({
        to: search.redirect ?? "/",
      });
    }
  },
});

const EmailForm = ({
  setEmailSentTo,
  passkeyLoading,
  setPasskeyLoading,
}: {
  setEmailSentTo: Dispatch<SetStateAction<string | undefined>>;
  passkeyLoading: boolean;
  setPasskeyLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const emailId = useId();

  const { redirect: redirectParam } = Route.useSearch();
  const { config } = Route.useRouteContext();
  const invalidateRouter = useInvalidateRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signInSchema),
  });

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Continue with email</CardTitle>
        <CardDescription>
          Enter your email to sign-in or create an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(async ({ email }) => {
            const result = await authClient.emailOtp.sendVerificationOtp({
              email,
              type: "sign-in",
            });

            if (result.data) {
              setEmailSentTo(email);
            } else {
              toast.error(
                "An error occurred while trying to send the sign-in code",
              );
            }
          })}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={emailId}>Email</FieldLabel>
              <Input
                {...register("email")}
                id={emailId}
                type="email webauthn"
                placeholder="m@example.com"
                autoComplete="email webauthn"
                aria-invalid={errors.email != null}
              />

              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>

            <Field>
              <Button type="submit" isLoading={isSubmitting}>
                <MailIcon className="mr-2 size-[1em]" />
                Send code
              </Button>
            </Field>
          </FieldGroup>
        </form>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-4">
          or
        </FieldSeparator>
        <div className="flex flex-col gap-2">
          <Button
            onClick={async () => {
              setPasskeyLoading(true);

              try {
                await authClient.signIn.passkey();
                await invalidateRouter();
              } catch {
                toast.error(
                  "An error occurred while trying to sign in with passkey",
                );
              }

              setPasskeyLoading(false);
            }}
            variant="outline"
            type="button"
            isLoading={passkeyLoading}
          >
            <FingerprintPatternIcon /> Sign-in with passkey
          </Button>
          {config?.oauthProviders.map(({ provider, name }) => (
            <Button
              key={provider}
              variant="outline"
              type="button"
              onClick={async () => {
                try {
                  await authClient.signIn.oauth2({
                    providerId: provider,
                    callbackURL: redirectParam,
                  });
                } catch {
                  toast.error(
                    `An error occurred while trying to sign in with ${name}`,
                  );
                }
              }}
            >
              Login with {name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const OTPForm = ({
  email,
  setEmail,
  redirectTo,
}: {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string | undefined>>;
  redirectTo: string | undefined;
}) => {
  const otpVerificationId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(otpSchema),
  });
  const navigate = useNavigate();
  const invalidateRouter = useInvalidateRouter();

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Verify your login</CardTitle>
        <CardDescription>
          Enter the verification code we sent to your email address:{" "}
          <span className="font-medium">{email}</span>.
        </CardDescription>
      </CardHeader>
      <form
        className="contents"
        onSubmit={handleSubmit(async ({ otp }) => {
          const result = await authClient.signIn.emailOtp({ email, otp });

          if (result.data) {
            await navigate({ to: redirectTo ?? "/" });
            await invalidateRouter();
          } else {
            toast.error(
              "An error occurred while trying to send the sign-in code",
            );
          }
        })}
      >
        <CardContent>
          <Field>
            <FieldLabel htmlFor={otpVerificationId}>
              Verification code
            </FieldLabel>
            <FieldContent>
              <Input
                {...register("otp")}
                id={otpVerificationId}
                placeholder="123456"
                autoComplete="one-time-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
              />
            </FieldContent>
            <FieldError>
              {errors.otp && <FieldError>{errors.otp.message}</FieldError>}
            </FieldError>
          </Field>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEmail(undefined);
            }}
          >
            Change email
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Verify
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

function RouteComponent() {
  const [emailSentTo, setEmailSentTo] = useState<string>();

  const { redirect: redirectParam } = Route.useSearch();

  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const invalidateRouter = useInvalidateRouter();

  const signInPasskey = useEffectEvent(async () => {
    if (
      // browser / context (HTTPS) check
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      await globalThis.PublicKeyCredential?.isConditionalMediationAvailable?.()
    ) {
      setPasskeyLoading(true);

      try {
        await authClient.signIn.passkey({ autoFill: true });
        await invalidateRouter();
      } catch {
        // ignore auto-fill errors
      }

      setPasskeyLoading(false);
    }
  });

  useEffect(() => {
    void signInPasskey();
  }, []);

  return (
    <Root title="Sign in" className="p-0 sm:p-5">
      {emailSentTo ? (
        <OTPForm
          email={emailSentTo}
          setEmail={setEmailSentTo}
          redirectTo={redirectParam}
        />
      ) : (
        <EmailForm
          passkeyLoading={passkeyLoading}
          setPasskeyLoading={setPasskeyLoading}
          setEmailSentTo={setEmailSentTo}
        />
      )}
    </Root>
  );
}
