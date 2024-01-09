import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import {
  ZAuthorizeUserInput,
  ZCreateUserInput,
} from "@nihalgonsalves/expenses-shared/types/user";

import { trpc } from "../api/trpc";
import { useResetCache } from "../api/useCacheReset";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
const SingleScreenCard = twx(
  Card,
)`border-0 rounded-none bg-inherit sm:bg-card sm:border sm:rounded-md`;

export const SignInForm = () => {
  const signInMutation = trpc.user.authorizeUser.useMutation();

  const form = useForm<z.infer<typeof ZAuthorizeUserInput>>({
    resolver: zodResolver(ZAuthorizeUserInput),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const resetCache = useResetCache();

  const onSubmit = async (values: z.infer<typeof ZAuthorizeUserInput>) => {
    await signInMutation.mutateAsync({
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
            <Button
              className="w-full"
              type="submit"
              isLoading={signInMutation.isLoading}
            >
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </SingleScreenCard>
  );
};

export const SignUpForm = () => {
  const signUpMutation = trpc.user.createUser.useMutation();

  const form = useForm<z.infer<typeof ZCreateUserInput>>({
    resolver: zodResolver(ZCreateUserInput),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const resetCache = useResetCache();

  const onSubmit = async (values: z.infer<typeof ZCreateUserInput>) => {
    await signUpMutation.mutateAsync({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    await resetCache();
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
            <Button
              className="w-full"
              type="submit"
              isLoading={signUpMutation.isLoading}
            >
              Sign Up
            </Button>
          </form>
        </Form>
      </CardContent>
    </SingleScreenCard>
  );
};
