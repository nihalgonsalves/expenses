import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useForm, useFormState } from "react-hook-form";
import { z } from "zod";

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
import { authClient } from "#/utils/auth";
import { toast } from "sonner";

const ZResetPasswordInput = z.object({
  token: z.string(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const ResetPasswordForm = ({ token }: { token: string }) => {
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(ZResetPasswordInput),
    mode: "onTouched",
    defaultValues: {
      token,
      password: "",
    },
  });
  const formState = useFormState({ control: form.control });

  const onSubmit = async (values: z.infer<typeof ZResetPasswordInput>) => {
    await authClient.resetPassword(
      {
        newPassword: values.password,
        token,
      },
      {
        onSuccess: async () => {
          await navigate({ to: "/auth/sign-in" });
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
            <Button
              className="w-full"
              type="submit"
              isLoading={formState.isSubmitting}
            >
              Reset Password
            </Button>
          </form>
        </Form>
      </CardContent>
    </SingleScreenCard>
  );
};
