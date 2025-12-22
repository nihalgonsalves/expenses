import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZAuthorizeUserInput } from "@nihalgonsalves/expenses-shared/types/user";

import { useTRPC } from "../../api/trpc";
import { useResetCache } from "../../api/useCacheReset";
import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

export const PrivacyForm = () => {
  const onLine = useNavigatorOnLine();
  const navigate = useNavigate();

  const [isReconfirming, setIsReconfirming] = useState(false);

  const form = useForm<z.infer<typeof ZAuthorizeUserInput>>({
    resolver: zodResolver(ZAuthorizeUserInput),
    mode: "onTouched",
  });

  const resetCache = useResetCache();
  const { trpc } = useTRPC();
  const { mutateAsync: anonymizeUser, isPending } = useMutation(
    trpc.user.anonymizeUser.mutationOptions(),
  );

  const onSubmit = async (values: z.infer<typeof ZAuthorizeUserInput>) => {
    if (!isReconfirming) {
      setIsReconfirming(true);
      return;
    }

    await anonymizeUser({ email: values.email, password: values.password });

    await resetCache();
    await navigate({ to: "/" });
  };

  const disabled = !onLine;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy and Data</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-sm">
          <p>
            Enter your current email and password to delete all personal sheets
            and transactions, as well as anonymize your name and email address.
          </p>
          <p>
            If you would like to delete or leave any groups, please do this{" "}
            <strong>before</strong> anonymising your account. Note that the
            anonymized account will remain linked to any remaining groups as a
            Deleted User.
          </p>
          <p>
            You can sign up with the same email address at any point in the
            future, but this action <strong>cannot</strong> be undone.
          </p>
        </div>
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
              isLoading={isPending}
              disabled={disabled}
              type="submit"
              variant="destructive"
              className="w-full"
            >
              {isReconfirming ? "Are you sure?" : "Anonymise your account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
