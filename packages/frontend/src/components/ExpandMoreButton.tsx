import { MdExpandMore } from 'react-icons/md';

import { Button } from './form/Button';

type ExpandMoreProps = {
  expand: boolean;
  onClick: () => void;
};

// TODO: Flip when open

export const ExpandMoreButton = ({ expand, onClick }: ExpandMoreProps) => (
  <Button
    onClick={onClick}
    aria-expanded={expand}
    aria-label="show more"
    className="btn-ghost"
  >
    <MdExpandMore />
  </Button>
);
