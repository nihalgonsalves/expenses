import { LoadingButton } from '@mui/lab';
import { Alert, Stack, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { trpc } from '../api/trpc';
import { prevalidateEmail } from '../utils/utils';

export const AuthenticationForm = ({ isSignUp }: { isSignUp: boolean }) => {
  const [name, setName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const queryClient = useQueryClient();

  const signUpMutation = trpc.user.createUser.useMutation();
  const signInMutation = trpc.user.authorizeUser.useMutation();

  const emailValid = prevalidateEmail(email);
  const passwordValid = password.length >= 10;

  const signInValid = emailValid && passwordValid;
  const valid = isSignUp ? name && signInValid : signInValid;

  const loading = signUpMutation.isLoading || signInMutation.isLoading;
  const error = signUpMutation.error ?? signInMutation.error;

  const handleAuthenticate = async () => {
    if (isSignUp) {
      await signUpMutation.mutateAsync({ name, email, password });
    } else {
      await signInMutation.mutateAsync({ email, password });
    }

    await queryClient.invalidateQueries();
  };

  return (
    <Stack
      spacing={3}
      component="form"
      onSubmit={(e) => {
        e.preventDefault();

        if (!valid) {
          return;
        }

        void handleAuthenticate();
      }}
    >
      {error && <Alert severity="error">{error.message}</Alert>}

      {isSignUp && (
        <TextField
          label="Name"
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      )}

      <TextField
        type="email"
        autoFocus={!isSignUp}
        label="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
      />

      <TextField
        type="password"
        label="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
      />

      <LoadingButton
        color="primary"
        variant="contained"
        type="submit"
        size="large"
        disabled={!valid}
        loading={loading}
      >
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </LoadingButton>
    </Stack>
  );
};
