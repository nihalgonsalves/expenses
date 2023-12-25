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
        variant="outline"
        onClick={() => {
          setClicked(false);
        }}
      >
        Cancel
      </Button>
      <Button
        isLoading={isLoading}
        variant="destructive"
        onClick={handleConfirmed}
      >
        {confirmLabel}
      </Button>
    </>
  ) : (
    <Button
      disabled={disabled}
      variant="outline"
      onClick={() => {
        setClicked(true);
      }}
    >
      {label}
    </Button>
  );
};
