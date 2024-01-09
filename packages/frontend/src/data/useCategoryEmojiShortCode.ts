import { useMemo } from "react";

import { trpc } from "../api/trpc";

export const useCategoryEmojiShortCode = (
  category: string,
): string | undefined => {
  const { data: categories } = trpc.transaction.getCategories.useQuery();

  const categoryById = useMemo(
    () =>
      categories ? Object.fromEntries(categories.map((c) => [c.id, c])) : {},
    [categories],
  );

  return categoryById[category]?.emojiShortCode;
};
