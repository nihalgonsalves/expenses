import { z } from 'zod';

export const ZGroup = z.object({
  id: z.string().uuid(),
  name: z.string(),
  currencyCode: z.string(),
});

export type Group = z.infer<typeof ZGroup>;

const ZParticipant = z.object({
  id: z.string().uuid(),
});

export const ZParticipantWithName = ZParticipant.extend({
  name: z.string(),
});

export const ZGroupWithParticipants = ZGroup.extend({
  participants: z.array(ZParticipant),
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
