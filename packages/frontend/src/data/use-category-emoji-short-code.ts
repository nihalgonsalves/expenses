import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../api/trpc";

export const useCategoryEmojiShortCode = (
  category: string,
): string | undefined => {
  const { trpc } = useTRPC();
  const { data: categories } = useQuery(
    trpc.transaction.getCategories.queryOptions(),
  );

  const categoryById = categories
    ? Object.fromEntries(categories.map((c) => [c.id, c]))
    : {};

  return categoryById[category]?.emojiShortCode;
};
