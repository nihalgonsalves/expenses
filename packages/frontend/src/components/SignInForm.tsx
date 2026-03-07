import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { ZAuthorizeUserInput } from "@nihalgonsalves/expenses-shared/types/user";

import { useInvalidateRouter } from "../api/useInvalidateRouter";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { twx } from "./ui/utils";
import { authClient } from "#/utils/auth";
import { RESET_PASSWORD_ROUTE } from "@nihalgonsalves/expenses-shared/routes";

// collapse into underlying layer on narrow screens
export const SingleScreenCard = twx(
  Card,
)`w-full border-0 rounded-none bg-inherit sm:bg-card sm:border sm:rounded-md`;

export const SignInForm = () => {
  const form = useForm({
    resolver: zodResolver(ZAuthorizeUserInput),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const formState = useFormState({ control: form.control });

  const onForgotPassword = async () => {
    await form.trigger("email");

    if (form.getFieldState("email").invalid) {
      return;
    }

    await authClient.requestPasswordReset(
      {
        email: form.getValues("email"),
        redirectTo: RESET_PASSWORD_ROUTE,
      },
      {
        onSuccess: () => {
          toast.success(
            "If the email matches a valid account, you will receive a link to reset your password.",
          );
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const invalidateRouter = useInvalidateRouter();

  const onSubmit = async (values: z.infer<typeof ZAuthorizeUserInput>) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: async () => {
          await invalidateRouter();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <SingleScreenCard>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-full"
              type="submit"
              isLoading={formState.isSubmitting}
            >
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onForgotPassword}>
          Forgot password?
        </Button>
      </CardFooter>
    </SingleScreenCard>
  );
};
