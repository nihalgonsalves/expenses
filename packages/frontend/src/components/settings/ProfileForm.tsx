import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon } from "lucide-react";
import { useForm, useFormState } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import {
  ZUpdateUserInput,
  type User,
} from "@nihalgonsalves/expenses-shared/types/user";

import { useInvalidateRouter } from "#/api/useInvalidateRouter";

import { useNavigatorOnLine } from "../../state/useNavigatorOnLine";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { authClient } from "#/utils/auth";

export const ProfileForm = ({ me }: { me: User }) => {
  const onLine = useNavigatorOnLine();
  const invalidateRouter = useInvalidateRouter();

  const form = useForm({
    resolver: zodResolver(ZUpdateUserInput),
    mode: "onTouched",
    defaultValues: {
      name: me.name,
      email: me.email,
      password: "",
      newPassword: "",
    },
  });

  const formState = useFormState({ control: form.control });
  const disabled = !onLine || !formState.isDirty;

  const onSubmit = async (values: z.infer<typeof ZUpdateUserInput>) => {
    try {
      if (me.email !== values.email) {
        await authClient.changeEmail(
          {
            newEmail: values.email,
          },
          {
            throw: true,
            onError: (ctx) => {
              toast.error(ctx.error.message);
            },
          },
        );

        toast.success("Please check your new email for a verification link.");
      }

      if (me.name !== values.name) {
        await authClient.updateUser(
          {
            name: values.name,
          },
          {
            throw: true,
            onError: (ctx) => {
              toast.error(ctx.error.message);
            },
          },
        );
      }

      if (values.password && values.newPassword) {
        await authClient.changePassword(
          {
            currentPassword: values.password,
            newPassword: values.newPassword,
          },
          {
            throw: true,
            onError: (ctx) => {
              toast.error(ctx.error.message);
            },
          },
        );
      }

      await invalidateRouter();
      form.reset({
        name: values.name,
        email: values.email,
        password: "",
        newPassword: "",
      });
    } catch {
      // errors reported above onError
    }
  };

  const onVerifyEmail = async () => {
    await authClient.sendVerificationEmail(
      {
        email: me.email,
      },
      {
        onSuccess: () => {
          toast.success("Please check your email for a verification link.");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
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

                  <FormDescription className="flex items-center gap-1.5">
                    {me.emailVerified ? (
                      <>
                        <CheckCircle2Icon className="text-md size-[1em]" />{" "}
                        Verified
                      </>
                    ) : (
                      <Button
                        onClick={onVerifyEmail}
                        type="button"
                        variant="link"
                        className="p-0"
                      >
                        Not verified. Resend verification email?
                      </Button>
                    )}
                  </FormDescription>

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
                  <FormDescription>(if changing password)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              isLoading={formState.isSubmitting}
              disabled={disabled}
              className="w-full"
            >
              Save
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
