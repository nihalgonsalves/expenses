import { MdQuestionMark } from 'react-icons/md';

import { categoryById } from '../data/categories';

export const CategoryAvatar = ({ category }: { category: string }) => (
  <div
    className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-3xl text-primary-content"
    aria-label={categoryById[category]?.name ?? category}
  >
    {categoryById[category]?.icon ?? <MdQuestionMark />}
  </div>
);
