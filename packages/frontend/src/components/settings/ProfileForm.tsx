import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { z } from 'zod';

import type { User } from '@nihalgonsalves/expenses-shared/types/user';

import { trpc } from '../../api/trpc';
import { useNavigatorOnLine } from '../../state/useNavigatorOnLine';
import { Button } from '../form/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';

const formSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Name cannot be empty',
    }),
    email: z.string().email({
      message: 'Invalid email',
    }),
    password: z.string(),
    newPassword: z.string(),
  })
  .refine(
    (data) => {
      if (
        data.password &&
        data.newPassword &&
        data.password !== data.newPassword
      ) {
        return true;
      }

      if (!data.password && !data.newPassword) {
        return true;
      }

      return false;
    },
    {
      message: 'The new password cannot be the same',
      path: ['newPassword'],
    },
  );

export const ProfileForm = ({ me }: { me: User }) => {
  const onLine = useNavigatorOnLine();
  const utils = trpc.useUtils();
  const { mutateAsync: updateUser, isLoading } =
    trpc.user.updateUser.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: me.name,
      email: me.email,
      password: '',
      newPassword: '',
    },
  });

  const disabled = !onLine || !form.formState.isDirty;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { name: newName, email: newEmail } = await updateUser({
      name: values.name,
      email: values.email,
      password: values.password ? values.password : undefined,
      newPassword: values.newPassword ? values.newPassword : undefined,
    });

    toast.success('Saved!');

    await utils.user.me.invalidate();

    form.reset({
      name: newName,
      email: newEmail,
    });
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
