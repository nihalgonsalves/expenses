import { randomUUID } from "crypto";

import { z } from "zod";

export const getUserData = () => {
  const userId = randomUUID();
  const name = `E2E User`;
  const email = `${userId}@example.com`;
  const password = randomUUID();

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
