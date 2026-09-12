import { useCategoryEmoji } from "../data/use-category-emoji-short-code";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const CategoryIcon = ({ category }: { category: string }) => {
  const emoji = useCategoryEmoji(category);

  return emoji ?? "❓";
};

export const CategoryAvatar = ({ category }: { category: string }) => (
  <Tooltip>
    <TooltipTrigger>
      <div
        className="bg-card flex size-10 items-center justify-center rounded-md border text-xl md:size-12"
        aria-label={category}
      >
        <CategoryIcon category={category} />
      </div>
    </TooltipTrigger>
    <TooltipContent side="left">
      <p>{category}</p>
    </TooltipContent>
  </Tooltip>
);
