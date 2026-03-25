import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { Root } from "../../pages/root";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { authClient } from "#/utils/auth";
import { useInvalidateRouter } from "#/api/use-invalidate-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "#/components/ui/card";
import {
  Field,
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

function RouteComponent() {
  const [passkeyLoading, setPasskeyLoading] = useState(false);

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
      <div className="grid place-items-center p-4">
        <Card>
          <CardHeader>
            <CardTitle>Continue with email</CardTitle>
            <CardDescription>
              Enter your email to sign-in or create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(async ({ email }) => {
                const result = await authClient.signIn.magicLink({
                  email,
                  callbackURL: redirectParam,
                });

                if (result.data) {
                  toast.success("Sign-in link sent! Please check your email.");
                } else {
                  toast.error(
                    "An error occurred while trying to send the sign-in link",
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
                  {errors.email && (
                    <p className="text-destructive text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </Field>

                <Field>
                  <Button type="submit" isLoading={isSubmitting}>
                    <MailIcon className="mr-2 size-[1em]" />
                    Send link
                  </Button>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card my-4">
                    or
                  </FieldSeparator>
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
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </Root>
  );
}
