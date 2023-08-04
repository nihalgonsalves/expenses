import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { trpc } from '../../api/trpc';
import { useResetCache } from '../../api/useCacheReset';
import { prevalidateEmail } from '../../utils/utils';
import { Button } from '../form/Button';
import { TextField } from '../form/TextField';

export const DeleteUserForm = () => {
  const navigate = useNavigate();

  const [isReconfirming, setIsReconfirming] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resetCache = useResetCache();
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

    await resetCache();
    navigate('/');
  };

  return (
    <div className="card card-bordered card-compact">
      <div className="card-body text-justify">
        <h2 className="card-title">Privacy and Data</h2>
        <p>
          Enter your current email and password to delete all personal sheets
          and expenses, as well as anonymize your name and email address.
        </p>
        <p>
          If you would like to delete or leave any groups, please do this{' '}
          <strong>before</strong> anonymising your account. Note that the
          anonymized account will remain linked to any remaining groups as a
          Deleted User.
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
          <Button
            isLoading={isLoading}
            disabled={!valid}
            type="submit"
            className="btn-error btn-block mt-4"
          >
            {isReconfirming ? 'Are you sure?' : 'Anonymise your account'}
          </Button>
        </form>
      </div>
    </div>
  );
};
