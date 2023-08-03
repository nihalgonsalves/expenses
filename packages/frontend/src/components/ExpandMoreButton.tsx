import { MdExpandMore } from 'react-icons/md';

type ExpandMoreProps = {
  expand: boolean;
  onClick: () => void;
};

// TODO: Flip when open

export const ExpandMoreButton = ({ expand, onClick }: ExpandMoreProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expand}
    aria-label="show more"
    className="btn btn-ghost"
  >
    <MdExpandMore />
  </button>
);
