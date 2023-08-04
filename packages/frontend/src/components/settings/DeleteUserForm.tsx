import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { prevalidateEmail } from '../../utils/utils';
import { LoadingButton } from '../form/LoadingButton';
import { TextField } from '../form/TextField';

export const DeleteUserForm = () => {
  const navigate = useNavigate();

  const [isReconfirming, setIsReconfirming] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const queryClient = useQueryClient();
  const { mutateAsync: anonymizeUser, isLoading } =
    trpc.user.anonymizeUser.useMutation();

  const valid = prevalidateEmail(email) && password.length > 0;

  const handleAnonymize = async () => {
    if (!valid) return;

    if (!isReconfirming) {
      setIsReconfirming(true);
      return;
    }

    await anonymizeUser({ email, password });

    await queryClient.invalidateQueries();
    navigate('/');
  };

  return (
    <div className="card card-bordered card-compact">
      <div className="card-body">
        <h2 className="card-title">Privacy and Data</h2>
        <p>
          Enter your current email and password to delete all personal sheets
          and expenses, as well as anonymize your name and email address.
        </p>
        <p>
          Note that the account will remain linked to any groups that you were
          part of, as there is no meaningful way to remove you from group
          expenses without affecting other users in the group. You will appear
          as a {'"Deleted User"'} in groups.
        </p>
        <p>
          If you would like to delete any groups where you are an admin, please
          do it <strong>before</strong> anonymising your account.
        </p>
        <p>
          You can sign up with the same email address at any point in the
          future, but this action <strong>cannot</strong> be undone.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();

            void handleAnonymize();
          }}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            setValue={setEmail}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-pasword"
            value={password}
            setValue={setPassword}
          />
          <LoadingButton
            isLoading={isLoading}
            disabled={!valid}
            type="submit"
            className="btn btn-error btn-block mt-4"
          >
            {isReconfirming ? 'Are you sure?' : 'Anonymise your account'}
          </LoadingButton>
        </form>
      </div>
    </div>
  );
};