import { TRPCClientError } from '@trpc/client';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { type User } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { prevalidateEmail } from '../../utils/utils';
import { LoadingButton } from '../form/LoadingButton';
import { TextField } from '../form/TextField';

export const ProfileForm = ({ me }: { me: User }) => {
  const { enqueueSnackbar } = useSnackbar();

  const utils = trpc.useContext();
  const { mutateAsync: updateUser, isLoading } =
    trpc.user.updateUser.useMutation();

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
  const unchanged =
    name === me.name && email === me.email && !password && !newPassword;

  const handleSubmit = async () => {
    try {
      const { name: newName, email: newEmail } = await updateUser({
        name,
        email,
        password: password ? password : undefined,
        newPassword: newPassword ? newPassword : undefined,
      });

      enqueueSnackbar('Saved!', { variant: 'success' });

      await utils.user.me.invalidate();

      setName(newName);
      setEmail(newEmail);
      setPassword('');
      setNewPassword('');
    } catch (e) {
      enqueueSnackbar(
        `Error saving profile: ${
          e instanceof TRPCClientError ? e.message : 'Unknown Error'
        }`,
        { variant: 'error' },
      );
      return;
    }
  };

  return (
    <form
      className="card card-bordered card-compact"
      onSubmit={(e) => {
        e.preventDefault();

        void handleSubmit();
      }}
    >
      <div className="card-body flex flex-col">
        <h2 className="card-title">Profile</h2>

        <TextField
          label="Name"
          type="text"
          autoComplete="name"
          value={name}
          setValue={setName}
        />

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          setValue={setEmail}
        />

        <TextField
          label="Current Password"
          labelAlt="(only required if changing password)"
          type="password"
          autoComplete="current-password"
          value={password}
          setValue={setPassword}
        />

        <TextField
          label="New Password"
          type="password"
          autoComplete="password"
          value={newPassword}
          setValue={setNewPassword}
        />

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          disabled={!valid || unchanged}
          className="btn btn-primary mt-4 w-full"
        >
          Save
        </LoadingButton>
      </div>
    </form>
  );
};
