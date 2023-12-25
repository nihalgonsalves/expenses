import { DotsVerticalIcon } from '@radix-ui/react-icons';

export const DropdownMenu = ({
  icon,
  'aria-label': ariaLabel,
  children,
}: {
  icon?: React.ReactNode;
  'aria-label': string;
  children: React.ReactNode;
}) => (
  <div className="dropdown dropdown-end">
    <div
      tabIndex={0}
      className="btn btn-circle btn-ghost text-3xl"
      aria-label={ariaLabel}
    >
      {icon ?? <DotsVerticalIcon />}
    </div>

    <ul
      tabIndex={0}
      className="menu dropdown-content rounded-box z-[2] mt-3 w-80 bg-base-200 text-base-content p-2 text-lg shadow"
    >
      {children}
    </ul>
  </div>
);
