import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import type { z } from "zod";

import { ZAuthorizeUserInput } from "@nihalgonsalves/expenses-shared/types/user";

import { useTRPC } from "../api/trpc";
import { useResetCache } from "../api/useCacheReset";

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

// collapse into underlying layer on narrow screens
export const SingleScreenCard = twx(
  Card,
)`w-full border-0 rounded-none bg-inherit sm:bg-card sm:border sm:rounded-md`;

export const SignInForm = () => {
  const { trpc } = useTRPC();

  const { mutateAsync: authorizeUser, isPending } = useMutation(
    trpc.user.authorizeUser.mutationOptions(),
  );

  const { mutateAsync: requestPasswordReset } = useMutation(
    trpc.user.requestPasswordReset.mutationOptions(),
  );

  const form = useForm<z.infer<typeof ZAuthorizeUserInput>>({
    resolver: zodResolver(ZAuthorizeUserInput),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onForgotPassword = useCallback(async () => {
    await form.trigger("email");

    if (form.getFieldState("email").invalid) {
      return;
    }

    await requestPasswordReset(form.getValues("email"));

    toast.success(
      "If the email matches a valid account, you will receive a link to reset your password.",
    );
  }, [form, requestPasswordReset]);

  const resetCache = useResetCache();

  const onSubmit = async (values: z.infer<typeof ZAuthorizeUserInput>) => {
    await authorizeUser({
      email: values.email,
      password: values.password,
    });

    await resetCache();
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
            <Button className="w-full" type="submit" isLoading={isPending}>
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button $variant="link" onClick={onForgotPassword}>
          Forgot password?
        </Button>
      </CardFooter>
    </SingleScreenCard>
  );
};
