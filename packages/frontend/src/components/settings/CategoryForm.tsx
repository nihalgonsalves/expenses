import Picker from '@emoji-mart/react';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { trpc } from '../../api/trpc';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';

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
  const { data: categories } = trpc.transaction.getCategories.useQuery();

  const { mutateAsync: setCategoryEmojiShortCode } =
    trpc.transaction.setCategoryEmojiShortCode.useMutation();
  const utils = trpc.useUtils();

  const handleEmojiSelect = async (id: string, data: unknown) => {
    const emoji = ZEmojiData.safeParse(data);

    if (!emoji.success) {
      // TODO: Sentry report or similar?
      toast.error('Emoji data was invalid');
      console.error('Emoji data was invalid', emoji.error);
      return;
    }

    await setCategoryEmojiShortCode({
      id,
      emojiShortCode: emoji.data.shortcodes,
    });

    await utils.transaction.getCategories.invalidate();
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
        <ScrollArea className="flex max-h-96 flex-col gap-4 overflow-y-auto">
          {categories?.map(({ id, emojiShortCode }) => (
            <div
              key={id}
              className="flex items-center gap-2 text-sm tracking-tight"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
