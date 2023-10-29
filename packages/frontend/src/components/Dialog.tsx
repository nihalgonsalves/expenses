import { useEffect, useRef } from 'react';

export const Dialog = ({
  children,
  isOpen,
  setIsOpen,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (ref.current) {
      if (isOpen) {
        // HMR workaround
        if (!ref.current.open) {
          ref.current.showModal();
        }
      } else {
        ref.current.close();
      }
    }
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <form method="dialog" className="modal-box">
        {children}
      </form>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};
