import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import type { z } from "zod";

import { ZUpdateUserInput } from "@nihalgonsalves/expenses-shared/types/user";
import type { User } from "@nihalgonsalves/expenses-shared/types/user";

import { trpc } from "../../api/trpc";
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

export const ProfileForm = ({ me }: { me: User }) => {
  const onLine = useNavigatorOnLine();
  const utils = trpc.useUtils();
  const { mutateAsync: updateUser, isLoading } =
    trpc.user.updateUser.useMutation();
  const { mutateAsync: requestEmailVerification } =
    trpc.user.requestEmailVerification.useMutation();

  const form = useForm<z.infer<typeof ZUpdateUserInput>>({
    resolver: zodResolver(ZUpdateUserInput),
    mode: "onTouched",
    defaultValues: {
      name: me.name,
      email: me.email,
      password: "",
      newPassword: "",
    },
  });

  const disabled = !onLine || !form.formState.isDirty;

  const onSubmit = async (values: z.infer<typeof ZUpdateUserInput>) => {
    const { name: newName, email: newEmail } = await updateUser({
      name: values.name,
      email: values.email,
      password: values.password ? values.password : undefined,
      newPassword: values.newPassword ? values.newPassword : undefined,
    });

    toast.success("Saved!");

    await utils.user.me.invalidate();

    form.reset({
      name: newName,
      email: newEmail,
    });
  };

  const onVerifyEmail = async () => {
    await requestEmailVerification();

    toast.success("Please check your email for a verification link.");
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
                        <CheckCircledIcon /> Verified
                      </>
                    ) : (
                      <Button
                        onClick={onVerifyEmail}
                        type="button"
                        $variant="link"
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
              isLoading={isLoading}
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
