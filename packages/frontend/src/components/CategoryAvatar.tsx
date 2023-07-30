import { QuestionMark } from '@mui/icons-material';
import { Avatar } from '@mui/material';

import { categoryById } from '../data/categories';

export const CategoryAvatar = ({ category }: { category: string }) => {
  return (
    <Avatar
      variant="rounded"
      sx={(theme) => ({ backgroundColor: theme.palette.primary.main })}
      aria-label={categoryById[category]?.name ?? category}
    >
      {categoryById[category]?.icon ?? <QuestionMark />}
    </Avatar>
  );
};
