import { ExpandMore } from '@mui/icons-material';
import { IconButton, type IconButtonProps, styled } from '@mui/material';

type ExpandMoreProps = {
  expand: boolean;
} & Pick<IconButtonProps, 'onClick'>;

export const ExpandMoreButton = styled(
  ({ expand, onClick }: ExpandMoreProps) => {
    return (
      <IconButton
        onClick={onClick}
        aria-expanded={expand}
        aria-label="show more"
      >
        <ExpandMore />
      </IconButton>
    );
  },
)(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));
