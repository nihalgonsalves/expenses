import { SheetParticipantRole } from '@prisma/client';
import { z } from 'zod';

export const ZSheet = z.object({
  id: z.string().nonempty(),
  name: z.string(),
  currencyCode: z.string(),
});
export type Sheet = z.infer<typeof ZSheet>;

export const ZParticipantWithName = z.object({
  id: z.string().nonempty(),
  name: z.string(),
});

export const ZFullParticipant = ZParticipantWithName.extend({
  email: z.string(),
  role: z.nativeEnum(SheetParticipantRole),
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
  participants: z.array(ZParticipantWithName),
});
export type GroupSheetByIdResponse = z.infer<typeof ZGroupSheetByIdResponse>;

export const ZGroupSheetsResponse = z.array(
  ZSheet.extend({
    participants: z.array(ZParticipantWithName),
  }),
);
export type GroupSheetsResponse = z.infer<typeof ZGroupSheetsResponse>;

export const ZCreatePersonalSheetInput = z.object({
  name: z.string(),
  currencyCode: z.string(),
});
export type CreatePersonalSheetInput = z.infer<
  typeof ZCreatePersonalSheetInput
>;
