import { useQuery, useMutation } from "@tanstack/react-query";
import { HelpCircleIcon } from "lucide-react";

import { useQueryClient } from "../../api/query-client";
import {
  transactionMutations,
  transactionQueries,
} from "../../api/transaction.functions";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
} from "../ui/emoji-picker";

export const CategoryForm = () => {
  const { invalidate } = useQueryClient();
  const { data: categories } = useQuery(
    transactionQueries.categories.queryOptions(),
  );

  const { mutateAsync: setCategoryEmoji } = useMutation(
    transactionMutations.setCategoryEmoji(),
  );

  const handleEmojiSelect = async (id: string, emoji: string) => {
    await setCategoryEmoji({ id, emoji });

    await invalidate(transactionQueries.categories.queryKey());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="text-sm tracking-tight">
          You can add icons to your categories here. To create more categories,
          add a new category when adding a transaction.
        </div>
        <div className="flex flex-col gap-4">
          {categories?.map(({ id, emoji: categoryEmoji }) => (
            <div
              key={id}
              className="flex items-center gap-2 text-sm tracking-tight"
            >
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-inherit"
                    >
                      {categoryEmoji ? categoryEmoji : <HelpCircleIcon />}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <EmojiPicker
                    onEmojiSelect={({ emoji: selectedEmoji }) =>
                      void handleEmojiSelect(id, selectedEmoji)
                    }
                    className="h-96"
                  >
                    <EmojiPickerSearch />
                    <EmojiPickerContent />
                  </EmojiPicker>
                </PopoverContent>
              </Popover>

              {id}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
