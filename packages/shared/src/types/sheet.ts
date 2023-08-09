import { z } from 'zod';

export const ZSheetType = z.union([z.literal('PERSONAL'), z.literal('GROUP')]);
export type SheetType = z.infer<typeof ZSheetType>;

export const ZSheet = z.object({
  id: z.string().nonempty(),
  type: ZSheetType,
  name: z.string(),
  currencyCode: z.string(),
});
export type Sheet = z.infer<typeof ZSheet>;

export const ZParticipant = z.object({
  id: z.string().nonempty(),
  name: z.string(),
});

export const ZFullParticipant = ZParticipant.extend({
  email: z.string(),
  role: z.union([z.literal('ADMIN'), z.literal('MEMBER')]),
});

export const ZGroupSheetWithParticipants = ZSheet.extend({
  participants: z.array(z.object({ id: z.string() })),
});
export type GroupSheetWithParticipants = z.infer<
  typeof ZGroupSheetWithParticipants
>;

export const ZCreateGroupSheetInput = z.object({
  name: z.string(),
  currencyCode: z.string(),
  additionalParticipantEmailAddresses: z.array(z.string()),
});
export type CreateGroupSheetInput = z.infer<typeof ZCreateGroupSheetInput>;

export const ZGroupSheetByIdResponse = ZSheet.extend({
  participants: z.array(ZFullParticipant),
});
export type GroupSheetByIdResponse = z.infer<typeof ZGroupSheetByIdResponse>;

export const ZSheetsResponse = z.array(
  ZSheet.extend({
    participants: z.array(ZParticipant),
  }),
);
export type SheetsResponse = z.infer<typeof ZSheetsResponse>;

export const ZCreatePersonalSheetInput = z.object({
  name: z.string(),
  currencyCode: z.string(),
});
export type CreatePersonalSheetInput = z.infer<
  typeof ZCreatePersonalSheetInput
>;
