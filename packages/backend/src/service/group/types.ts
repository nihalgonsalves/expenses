import { GroupParticipantRole } from '@prisma/client';
import { z } from 'zod';

export const ZGroup = z.object({
  id: z.string().nonempty(),
  name: z.string(),
  currencyCode: z.string(),
});

export type Group = z.infer<typeof ZGroup>;

export const ZParticipantWithName = z.object({
  id: z.string().nonempty(),
  name: z.string(),
});

export const ZFullParticipant = ZParticipantWithName.extend({
  email: z.string(),
  role: z.nativeEnum(GroupParticipantRole),
});

export const ZGroupWithParticipants = ZGroup.extend({
  participants: z.array(z.object({ id: z.string() })),
});

export type GroupWithParticipants = z.infer<typeof ZGroupWithParticipants>;

export const ZCreateGroupInput = z.object({
  name: z.string(),
  currencyCode: z.string(),
  additionalParticipantEmailAddresses: z.array(z.string()),
});

export type CreateGroupInput = z.infer<typeof ZCreateGroupInput>;

export const ZGroupByIdResponse = ZGroup.extend({
  participants: z.array(ZParticipantWithName),
});

export type GroupByIdResponse = z.infer<typeof ZGroupByIdResponse>;

export const ZGroupsResponse = z.array(
  ZGroup.extend({
    participants: z.array(ZParticipantWithName),
  }),
);

export type GroupsResponse = z.infer<typeof ZGroupsResponse>;
