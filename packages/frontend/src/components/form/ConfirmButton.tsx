import { useState } from 'react';

import { Button } from './Button';

export const ConfirmButton = ({
  label,
  confirmLabel,
  isLoading,
  handleConfirmed,
  disabled,
}: {
  label: React.ReactNode;
  confirmLabel: React.ReactNode;
  isLoading: boolean;
  handleConfirmed: () => void;
  disabled?: boolean;
}) => {
  const [clicked, setClicked] = useState(false);

  return clicked ? (
    <>
      <Button
        className="btn-outline btn-block"
        onClick={() => {
          setClicked(false);
        }}
      >
        Cancel
      </Button>
      <Button
        isLoading={isLoading}
        className="btn-error btn-block"
        onClick={handleConfirmed}
      >
        {confirmLabel}
      </Button>
    </>
  ) : (
    <Button
      disabled={disabled}
      className="btn-error btn-outline btn-block"
      onClick={() => {
        setClicked(true);
      }}
    >
      {label}
    </Button>
  );
};
