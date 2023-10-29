import { type MouseEvent, useCallback, useState } from 'react';

import { Dialog } from '../Dialog';

import { Button } from './Button';

export const ConfirmDialog = ({
  description,
  confirmLabel,
  onConfirm,
  renderButton,
}: {
  description: React.ReactNode;
  confirmLabel: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  renderButton: (onClick: () => void) => React.ReactNode;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirmed = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await onConfirm();
        setIsOpen(false);
      } catch {
        setIsLoading(false);
      }
    },
    [onConfirm],
  );

  return (
    <>
      <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
        <h3 className="font-bold text-lg">Confirm</h3>
        <p className="py-4">{description}</p>
        <div className="modal-action">
          <button className="btn">Cancel</button>
          <Button
            className="btn-error"
            isLoading={isLoading}
            onClick={handleConfirmed}
          >
            {confirmLabel}
          </Button>
        </div>
      </Dialog>
      {renderButton(() => {
        setIsOpen(true);
      })}
    </>
  );
};
