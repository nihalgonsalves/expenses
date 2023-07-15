import { GroupParticipantRole } from '@prisma/client';
import { z } from 'zod';

export const ZCreateGroupInput = z.object({
  name: z.string(),
  defaultCurrency: z.string(),
  additionalParticipantEmailAddresses: z.array(z.string()),
});

export type CreateGroupInput = z.infer<typeof ZCreateGroupInput>;

export const ZGroupByIdResponse = z.object({
  id: z.string(),
  name: z.string(),
  defaultCurrency: z.string(),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.nativeEnum(GroupParticipantRole),
    }),
  ),
});

export type GroupByIdResponse = z.infer<typeof ZGroupByIdResponse>;
