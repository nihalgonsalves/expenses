import { type RxDocument } from 'rxdb';
import { z } from 'zod';

const ZSplitGroupParticipant = z.object({
  name: z.string(),
});

/** Group with participants and expenses to split */
export const ZSplitGroup = z.object({
  id: z.string().nonempty().max(64),
  name: z.string().nonempty(),
  currency: z.string().nonempty(),
  owner: ZSplitGroupParticipant,
  participants: z.array(ZSplitGroupParticipant),
});

export type SplitGroup = z.infer<typeof ZSplitGroup>;

export type SplitGroupDocument = RxDocument<SplitGroup>;
