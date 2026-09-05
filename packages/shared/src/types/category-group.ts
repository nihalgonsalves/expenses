import { z } from "zod";

export const ZCategoryGroup = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Name is required"),
  categories: z
    .array(z.string().trim().min(1))
    .max(100)
    .refine(
      (categories) => new Set(categories).size === categories.length,
      "Categories must be unique",
    ),
});

export type CategoryGroup = z.infer<typeof ZCategoryGroup>;

export const ZCreateCategoryGroupInput = ZCategoryGroup.omit({ id: true });
export type CreateCategoryGroupInput = z.infer<
  typeof ZCreateCategoryGroupInput
>;

export const ZUpdateCategoryGroupInput = ZCategoryGroup;
export type UpdateCategoryGroupInput = z.infer<
  typeof ZUpdateCategoryGroupInput
>;
