import {
  MdArrowBack,
  MdGroup,
  MdHome,
  MdSettings,
  MdTableView,
} from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';

import { NavBarAvatar } from '../components/NavBarAvatar';
import { clsxtw } from '../utils/utils';

export const Root = ({
  title,
  children,
  showBackButton,
  mainClassName,
  additionalChildren,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  showBackButton?: boolean;
  mainClassName?: string;
  additionalChildren?: React.ReactNode;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <header className="navbar bg-primary text-primary-content">
        {showBackButton && (
          <button
            type="button"
            className="btn btn-ghost text-2xl"
            onClick={() => {
              navigate(-1);
            }}
          >
            <MdArrowBack />
          </button>
        )}

        <div className="ms-2 flex-grow text-2xl font-semibold normal-case">
          {title}
        </div>

        <NavBarAvatar />
      </header>

      <main
        className={clsxtw(
          'flex flex-grow flex-col overflow-y-auto p-5',
          mainClassName,
        )}
      >
        {children}
      </main>
      {additionalChildren}

      <nav
        className="btm-nav flex-shrink-0 border-t-2 border-primary text-xl text-primary"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) - 1em)',
          position: 'unset',
          top: 'unset',
          left: 'unset',
          right: 'unset',
        }}
      >
        <NavLink to="/">
          <MdHome />
        </NavLink>
        <NavLink to="/sheets">
          <MdTableView />
        </NavLink>
        <NavLink to="/groups">
          <MdGroup />
        </NavLink>
        <NavLink to="/settings">
          <MdSettings />
        </NavLink>
      </nav>
    </div>
  );
};
