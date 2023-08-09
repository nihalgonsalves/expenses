import { type MouseEvent, useCallback, useRef, useState } from 'react';

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
  const ref = useRef<HTMLDialogElement>(null);

  const handleConfirmed = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        await onConfirm();
        ref.current?.close();
      } catch {
        setIsLoading(false);
      }
    },
    [onConfirm],
  );

  return (
    <>
      <dialog ref={ref} className="modal">
        <form method="dialog" className="modal-box">
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
        </form>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      {renderButton(() => {
        ref.current?.showModal();
      })}
    </>
  );
};
