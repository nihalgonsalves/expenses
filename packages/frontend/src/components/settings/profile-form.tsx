import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useCurrentUser } from "#/api/use-current-user";
import { useInvalidateRouter } from "#/api/use-invalidate-router.js";
import { authClient } from "#/utils/auth.js";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";

const ZNameFormValues = z.object({
  name: z.string().min(1, "Name is required"),
});

const NameCard = ({ name }: { name: string }) => {
  const invalidateRouter = useInvalidateRouter();

  const form = useForm({
    resolver: zodResolver(ZNameFormValues),
    mode: "onTouched",
    defaultValues: { name },
  });

  const onSubmit = async (values: z.infer<typeof ZNameFormValues>) => {
    const result = await authClient.updateUser({ name: values.name });

    if (result.data?.status) {
      toast.success("Name updated successfully");
      await invalidateRouter();
    } else {
      toast.error(
        `Failed to update name: ${result.error?.message ?? "Unknown error"}`,
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              variant="secondary"
              isLoading={form.formState.isSubmitting}
            >
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

const EmailCard = ({ email }: { email: string }) => {
  const schema = z.object({
    email: z
      .email()
      .refine((next) => next !== email, "New email must be different"),
  });

  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { email },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const result = await authClient.changeEmail({ newEmail: values.email });

    if (result.data?.status) {
      toast.success("Check your email for a verification link");
    } else {
      toast.error(
        `Failed to update email: ${result.error?.message ?? "Unknown error"}`,
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              variant="secondary"
              isLoading={form.formState.isSubmitting}
            >
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export const ProfileForm = () => {
  const user = useCurrentUser();
  if (!user) {
    return null;
  }

  return (
    <>
      <NameCard name={user.name} />
      <EmailCard email={user.email} />
    </>
  );
};
