import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZResetPasswordInput } from "@nihalgonsalves/expenses-shared/types/user";

import { useTRPC } from "../api/trpc";

import { SingleScreenCard } from "./SignInForm";
import { Button } from "./ui/button";
import { CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const navigate = useNavigate();

  const { trpc } = useTRPC();
  const { mutateAsync: resetPassword, isPending } = useMutation(
    trpc.user.resetPassword.mutationOptions(),
  );

  const form = useForm<z.infer<typeof ZResetPasswordInput>>({
    resolver: zodResolver(ZResetPasswordInput),
    mode: "onTouched",
    defaultValues: {
      token,
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof ZResetPasswordInput>) => {
    await resetPassword(values);

    await navigate({ to: "/auth/sign-in" });
  };

  return (
    <SingleScreenCard>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" isLoading={isPending}>
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </SingleScreenCard>
  );
};
