import { useCategoryEmojiShortCode } from "../data/useCategoryEmojiShortCode";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const CategoryIcon = ({ category }: { category: string }) => {
  const shortCode = useCategoryEmojiShortCode(category);

  return shortCode ? <em-emoji shortcodes={shortCode} /> : "❓";
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
