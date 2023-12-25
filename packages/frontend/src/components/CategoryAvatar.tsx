import { QuestionMarkIcon } from '@radix-ui/react-icons';

import { categoryById } from '../data/categories';

export const CategoryAvatar = ({ category }: { category: string }) => (
  <div
    className="flex size-12 items-center justify-center rounded-md bg-primary text-3xl text-primary-foreground"
    aria-label={categoryById[category]?.name ?? category}
  >
    {categoryById[category]?.icon ?? <QuestionMarkIcon />}
  </div>
);
