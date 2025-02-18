import Picker from "@emoji-mart/react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { z } from "zod";

import { useTRPC } from "../../api/trpc";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";

const ZEmojiData = z.object({
  id: z.string(),
  name: z.string(),
  shortcodes: z.string(),
  keywords: z.array(z.string()),
  // aliases: z.array(z.string()).optional(),
  // emoticons: z.array(z.string()).optional(),
  // native: z.string(),
  // unified: z.string(),
  // skin: z.number().optional(),
});

export const CategoryForm = () => {
  const { trpc, invalidate } = useTRPC();
  const { data: categories } = useQuery(
    trpc.transaction.getCategories.queryOptions(),
  );

  const { mutateAsync: setCategoryEmojiShortCode } = useMutation(
    trpc.transaction.setCategoryEmojiShortCode.mutationOptions(),
  );

  const handleEmojiSelect = async (id: string, data: unknown) => {
    const emoji = ZEmojiData.safeParse(data);

    if (!emoji.success) {
      // TODO: Sentry report or similar?
      toast.error("Emoji data was invalid");
      console.error("Emoji data was invalid", emoji.error);
      return;
    }

    await setCategoryEmojiShortCode({
      id,
      emojiShortCode: emoji.data.shortcodes,
    });

    await invalidate(trpc.transaction.getCategories.queryKey());
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
        <ScrollArea viewportClassName="max-h-96">
          <div className="flex flex-col gap-4">
            {categories?.map(({ id, emojiShortCode }) => (
              <div
                key={id}
                className="flex items-center gap-2 text-sm tracking-tight"
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      $variant="outline"
                      $size="icon"
                      className="bg-inherit"
                    >
                      {emojiShortCode ? (
                        <em-emoji shortcodes={emojiShortCode} />
                      ) : (
                        <QuestionMarkCircledIcon />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Picker
                      onEmojiSelect={(emojiData: unknown) => {
                        void handleEmojiSelect(id, emojiData);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {id}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
