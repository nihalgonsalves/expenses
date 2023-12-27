import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { trpc } from '../api/trpc';
import { useResetCache } from '../api/useCacheReset';

import { Button } from './form/Button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email({
    message: 'Invalid email',
  }),
  password: z.string().min(1, {
    message: 'Password cannot be empty',
  }),
});

export const AuthenticationForm = ({ isSignUp }: { isSignUp: boolean }) => {
  const schema = useMemo(
    () =>
      isSignUp
        ? formSchema.refine(({ name }) => name, {
            message: 'Name cannot be empty',
            path: ['name'],
          })
        : formSchema,
    [isSignUp],
  );

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
    },
  });

  const resetCache = useResetCache();

  const signUpMutation = trpc.user.createUser.useMutation();
  const signInMutation = trpc.user.authorizeUser.useMutation();

  const isLoading = signUpMutation.isLoading || signInMutation.isLoading;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log('??');
    if (isSignUp) {
      await signUpMutation.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      });
    } else {
      await signInMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
    }

    await resetCache();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isSignUp && (
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
        )}

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

        <Button className="w-full" type="submit" isLoading={isLoading}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
      </form>
    </Form>
  );
};
