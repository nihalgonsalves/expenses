import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { personalSheetFactory, userFactory } from "../../../test/factories.ts";
import { getTRPCCaller } from "../../../test/get-trpc-caller.ts";
import { createPersonalSheetTransactionInput } from "../../../test/input.ts";
import { setupMockServer } from "../../../test/msw.ts";
import { config } from "../../config.ts";

const { prisma, betterAuth, useProtectedCaller } = await getTRPCCaller();
const mockServer = setupMockServer();
const currenciesUrl = new URL(
  "/v2/currencies",
  config.FRANKFURTER_BASE_URL,
).toString();

describe("getSupportedCurrencies", () => {
  it("ranks original transaction currencies in PostgreSQL", async () => {
    mockServer.use(
      http.get(currenciesUrl, () =>
        HttpResponse.json([
          { iso_code: "EUR", name: "Euro" },
          { iso_code: "INR", name: "Indian Rupee" },
          { iso_code: "USD", name: "United States Dollar" },
        ]),
      ),
    );

    const userAndCookie = await userFactory(prisma, betterAuth);
    const caller = useProtectedCaller(userAndCookie);
    const euroSheet = await personalSheetFactory(prisma, {
      withOwnerId: userAndCookie.user.id,
      currencyCode: "EUR",
    });
    await personalSheetFactory(prisma, {
      withOwnerId: userAndCookie.user.id,
      currencyCode: "USD",
    });

    await Promise.all([
      caller.transaction.createPersonalSheetTransaction({
        ...createPersonalSheetTransactionInput(euroSheet.id, "EUR", "EXPENSE"),
        originalMoney: { amount: 8_500_00, scale: 2, currencyCode: "INR" },
      }),
      caller.transaction.createPersonalSheetTransaction({
        ...createPersonalSheetTransactionInput(euroSheet.id, "EUR", "EXPENSE"),
        originalMoney: { amount: 4_250_00, scale: 2, currencyCode: "INR" },
      }),
      caller.transaction.createPersonalSheetTransaction(
        createPersonalSheetTransactionInput(euroSheet.id, "EUR", "EXPENSE"),
      ),
    ]);

    await expect(
      caller.currencyConversion.getSupportedCurrencies(),
    ).resolves.toEqual({
      frequent: ["INR", "EUR", "USD"],
      supported: ["EUR", "INR", "USD"],
    });
  });
});
