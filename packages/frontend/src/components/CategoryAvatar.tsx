import { QuestionMarkIcon } from '@radix-ui/react-icons';

import { categoryById } from '../data/categories';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export const CategoryAvatar = ({ category }: { category: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger>
        <div
          className="flex size-12 items-center justify-center rounded-md border text-xl text-primary-foreground"
          aria-label={categoryById[category]?.name ?? category}
        >
          {categoryById[category]?.icon ?? <QuestionMarkIcon />}
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-muted text-muted-foreground">
        <p>{category}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
