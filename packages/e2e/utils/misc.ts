import { nanoid } from "nanoid";
import { z } from "zod";

export const getUserData = () => {
  const userId = nanoid(8);
  const name = `E2E User`;
  const email = `${userId}@example.com`;
  const password = nanoid(8);

  return { userId, name, email, password };
};

// https://mailpit.axllent.org/docs/api-v1/view.html#get-/api/v1/message/-ID-
export const ZEmail = z.object({
  From: z.object({
    Address: z.string(),
    Name: z.string(),
  }),
  To: z.array(
    z.object({
      Address: z.string(),
      Name: z.string(),
    }),
  ),
  Text: z.string(),
});
