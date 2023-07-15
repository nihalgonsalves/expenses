import { z } from 'zod';

export const ZCreateGroupInput = z.object({
  name: z.string(),
  defaultCurrency: z.string(),
  additionalParticipantIds: z.array(z.string()),
});

export type CreateGroupInput = z.infer<typeof ZCreateGroupInput>;
