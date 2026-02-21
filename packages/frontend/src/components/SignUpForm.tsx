import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { ZCreateUserInput } from "@nihalgonsalves/expenses-shared/types/user";

import { useTRPC } from "../api/trpc";
import { useInvalidateRouter } from "../api/useInvalidateRouter";

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

export const SignUpForm = () => {
  const { trpc } = useTRPC();
  const { mutateAsync: createUser, isPending } = useMutation(
    trpc.user.createUser.mutationOptions(),
  );

  const form = useForm({
    resolver: zodResolver(ZCreateUserInput),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const invalidateRouter = useInvalidateRouter();

  const onSubmit = async (values: z.infer<typeof ZCreateUserInput>) => {
    await createUser({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    await invalidateRouter();
  };

  return (
    <SingleScreenCard>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
    </SingleScreenCard>
  );
};
