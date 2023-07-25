import { LoadingButton } from '@mui/lab';
import { Alert, Stack, TextField } from '@mui/material';
import { useState } from 'react';

import { type User } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../api/trpc';
import { prevalidateEmail } from '../utils/utils';

export const ProfileForm = ({ me }: { me: User }) => {
  const utils = trpc.useContext();
  const updateUser = trpc.user.updateUser.useMutation();

  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const passwordValid =
    (!password && !newPassword) ||
    (password.length >= 10 &&
      newPassword.length >= 10 &&
      password !== newPassword);

  const valid = name && prevalidateEmail(email) && passwordValid;

  const handleSubmit = async () => {
    const { name: newName, email: newEmail } = await updateUser.mutateAsync({
      name,
      email,
      password: password ? password : undefined,
      newPassword: newPassword ? newPassword : undefined,
    });

    await utils.user.me.invalidate();

    setName(newName);
    setEmail(newEmail);
    setPassword('');
    setNewPassword('');
  };

  return (
    <Stack
      gap={2}
      component="form"
      onSubmit={(e) => {
        e.preventDefault();

        void handleSubmit();
      }}
    >
      {updateUser.error && (
        <Alert severity="error">{updateUser.error.message}</Alert>
      )}

      <TextField
        label="Name"
        autoComplete="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        fullWidth
      />

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        fullWidth
      />

      <TextField
        label="Old password (only required if changing password)"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        fullWidth
      />

      <TextField
        label="New password"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
        }}
        fullWidth
      />

      <LoadingButton
        type="submit"
        loading={updateUser.isLoading}
        disabled={!valid}
        variant="contained"
      >
        Save
      </LoadingButton>
    </Stack>
  );
};
