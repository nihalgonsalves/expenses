import { useState } from 'react';
import { toast } from 'react-hot-toast';

import type { User } from '@nihalgonsalves/expenses-backend';

import { trpc } from '../../api/trpc';
import { prevalidateEmail } from '../../utils/utils';
import { LoadingButton } from '../form/LoadingButton';
import { TextField } from '../form/TextField';

export const ProfileForm = ({ me }: { me: User }) => {
  const utils = trpc.useContext();
  const { mutateAsync: updateUser, isLoading } =
    trpc.user.updateUser.useMutation();

  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const passwordValid =
    (!password && !newPassword) ||
    (password.length >= 0 &&
      newPassword.length >= 0 &&
      password !== newPassword);

  const valid = name !== '' && prevalidateEmail(email) && passwordValid;
  const unchanged =
    name === me.name && email === me.email && !password && !newPassword;

  const handleSubmit = async () => {
    const { name: newName, email: newEmail } = await updateUser({
      name,
      email,
      password: password ? password : undefined,
      newPassword: newPassword ? newPassword : undefined,
    });

    toast.success('Saved!');

    await utils.user.me.invalidate();

    setName(newName);
    setEmail(newEmail);
    setPassword('');
    setNewPassword('');
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
          labelAlt="(if changing password)"
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
