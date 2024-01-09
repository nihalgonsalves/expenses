import { z } from "zod";

export const ZSheetType = z.union([z.literal("PERSONAL"), z.literal("GROUP")]);
export type SheetType = z.infer<typeof ZSheetType>;

export const ZSheet = z.object({
  id: z.string().min(1),
  type: ZSheetType,
  name: z.string().min(1),
  currencyCode: z.string().length(3),
  isArchived: z.boolean(),
});
export type Sheet = z.infer<typeof ZSheet>;

export const ZParticipant = z.object({
  id: z.string().min(1),
  name: z.string(),
});

export const ZFullParticipant = ZParticipant.extend({
  email: z.string(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const ZGroupSheetWithParticipants = ZSheet.extend({
  participants: z.array(z.object({ id: z.string() })),
});
export type GroupSheetWithParticipants = z.infer<
  typeof ZGroupSheetWithParticipants
>;

export const ZCreateGroupSheetInput = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  currencyCode: z.string().length(3, { message: "Currency code is required" }),
  additionalParticipantEmailAddresses: z.array(
    z.object({ email: z.string().email({ message: "Invalid email address" }) }),
  ),
});
export type CreateGroupSheetInput = z.infer<typeof ZCreateGroupSheetInput>;

export const ZGroupSheetByIdResponse = ZSheet.extend({
  participants: z.array(ZFullParticipant),
});
export type GroupSheetByIdResponse = z.infer<typeof ZGroupSheetByIdResponse>;

export const ZSheetsQuery = z.object({
  includeArchived: z.boolean(),
});

export const ZSheetsResponse = z.array(
  ZSheet.extend({
    participants: z.array(ZParticipant),
  }),
);
export type SheetsResponse = z.infer<typeof ZSheetsResponse>;

export const ZCreatePersonalSheetInput = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  currencyCode: z.string().length(3, { message: "Currency code is required" }),
});
export type CreatePersonalSheetInput = z.infer<
  typeof ZCreatePersonalSheetInput
>;
