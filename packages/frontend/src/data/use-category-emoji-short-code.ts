import { useQuery } from "@tanstack/react-query";

import { transactionQueries } from "../api/transaction";

export const useCategoryEmojiShortCode = (
  category: string,
): string | undefined => {
  const { data: categories } = useQuery(
    transactionQueries.categories.queryOptions(),
  );

  const categoryById = categories
    ? Object.fromEntries(categories.map((c) => [c.id, c]))
    : {};

  return categoryById[category]?.emojiShortCode;
};
