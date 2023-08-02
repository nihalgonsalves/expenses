import { useState } from 'react';

import { LoadingButton } from './LoadingButton';

export const ConfirmButton = ({
  label,
  confirmLabel,
  isLoading,
  handleConfirmed,
}: {
  label: React.ReactNode;
  confirmLabel: React.ReactNode;
  isLoading: boolean;
  handleConfirmed: () => void;
}) => {
  const [clicked, setClicked] = useState(false);

  return clicked ? (
    <>
      <button
        type="button"
        className="btn btn-outline btn-block"
        onClick={() => {
          setClicked(false);
        }}
      >
        Cancel
      </button>
      <LoadingButton
        isLoading={isLoading}
        className="btn btn-error btn-block"
        onClick={handleConfirmed}
      >
        {confirmLabel}
      </LoadingButton>
    </>
  ) : (
    <button
      type="button"
      className="btn btn-error btn-outline btn-block"
      onClick={() => {
        setClicked(true);
      }}
    >
      {label}
    </button>
  );
};
