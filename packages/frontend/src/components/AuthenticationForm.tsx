import { Alert, Button, Stack, TextField } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../api/trpc';
import { prevalidateEmail } from '../utils/utils';

export const AuthenticationForm = ({ isSignUp }: { isSignUp: boolean }) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const queryClient = useQueryClient();

  const redirect = async () => {
    await queryClient.invalidateQueries();

    navigate('/');
  };

  const signUpMutation = trpc.user.createUser.useMutation({
    onSuccess: redirect,
  });
  const signInMutation = trpc.user.authorizeUser.useMutation({
    onSuccess: redirect,
  });

  const emailValid = prevalidateEmail(email);
  const passwordValid = password.length >= 10;

  const signInValid = emailValid && passwordValid;
  const valid = isSignUp ? name && signInValid : signInValid;

  const error = signUpMutation.error ?? signInMutation.error;

  const handleAuthenticate = () => {
    if (isSignUp) {
      signUpMutation.mutate({ name, email, password });
    } else {
      signInMutation.mutate({ email, password });
    }
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
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      )}

      <TextField
        type="email"
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

      <Button
        color="primary"
        variant="contained"
        type="submit"
        size="large"
        disabled={!valid}
      >
        Sign In
      </Button>
    </Stack>
  );
};
