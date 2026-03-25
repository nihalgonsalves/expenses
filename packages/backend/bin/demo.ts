import "temporal-polyfill/global";
import { faker } from "@faker-js/faker";
import { createTRPCClient, httpLink } from "@trpc/client";
import fetchCookie from "fetch-cookie";
import { createAuthClient } from "better-auth/react";

import type { AppRouter } from "../src/app-router.ts";

const DEMO_A_EMAIL = "user@example.com";
const DEMO_B_EMAIL = "other-user@example.com";

const DEMO_PASSWORD = "password1234";

const authClient = createAuthClient({
  baseURL: "http://localhost:5174/auth",
  fetchOptions: {
    headers: {
      Origin: "http://localhost:5173",
    },
  },
});

const fetchA = fetchCookie(fetch);
const fetchB = fetchCookie(fetch);

const getClient = (fetchFn: typeof fetch) =>
  createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: "http://localhost:5174/trpc",
        // @ts-expect-error slightly divering fetch types
        fetch: fetchFn,
      }),
    ],
  });

const clientA = getClient(fetchA);
await clientA.health.query();

const [
  {
    user: { id: idA },
  },
  {
    user: { id: idB },
  },
] = await Promise.all([
  authClient.signUp.email(
    {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: DEMO_A_EMAIL,
      password: DEMO_PASSWORD,
    },
    { throw: true, customFetchImpl: fetchA },
  ),
  authClient.signUp.email(
    {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: DEMO_B_EMAIL,
      password: DEMO_PASSWORD,
    },
    { throw: true, customFetchImpl: fetchB },
  ),
]);

const { id: personalSheetId } = await clientA.sheet.createPersonalSheet.mutate({
  name: "Personal Expenses",
  currencyCode: "EUR",
});

const { id: groupSheetId } = await clientA.sheet.createGroupSheet.mutate({
  name: "🌍 Berlin Trip",
  currencyCode: "EUR",
});

await clientA.sheet.addGroupSheetMember.mutate({
  groupSheetId,
  email: DEMO_B_EMAIL,
});

const spentAt = Temporal.Now.zonedDateTimeISO("Europe/Berlin").toString();

const eur = (amountCents: number) => ({
  currencyCode: "EUR",
  amount: amountCents,
  scale: 2,
});

await clientA.transaction.batchCreatePersonalSheetTransactions.mutate({
  personalSheetId,
  transactions: [
    {
      type: "EXPENSE",
      category: "Rent",
      description: "",
      // between 500 and 1,000 € in increments of 50 €
      money: eur(faker.number.int({ min: 50, max: 100 }) * 1000),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Utilities",
      description: "",
      money: eur(faker.number.int({ min: 50_00, max: 100_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Groceries",
      description: "",
      money: eur(faker.number.int({ min: 20_00, max: 50_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Drinks",
      description: "",
      money: eur(faker.number.int({ min: 10_00, max: 20_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Movies",
      description: "",
      money: eur(faker.number.int({ min: 10_00, max: 20_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Eating Out",
      description: "",
      money: eur(faker.number.int({ min: 25_00, max: 50_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Shopping",
      description: "",
      money: eur(faker.number.int({ min: 100_00, max: 200_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Transport",
      description: "",
      money: eur(faker.number.int({ min: 50_00, max: 100_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Travel",
      description: "",
      money: eur(faker.number.int({ min: 200_00, max: 500_00 })),
      spentAt,
    },
    {
      type: "EXPENSE",
      category: "Health",
      description: "",
      money: eur(faker.number.int({ min: 10_00, max: 50_00 })),
      spentAt,
    },
  ],
});

const shareA = faker.number.int({ min: 75_00, max: 150_00 });
const shareB = faker.number.int({ min: 75_00, max: 150_00 });

await clientA.transaction.createGroupSheetTransaction.mutate({
  groupSheetId,
  type: "EXPENSE",
  category: "Travel",
  description: "Train tickets",
  money: eur(shareA + shareB),
  spentAt,
  paidOrReceivedById: idA,
  splits: [
    { participantId: idA, share: eur(shareA) },
    { participantId: idB, share: eur(shareB) },
  ],
});

await Promise.all(
  Object.entries({
    Drinks: ":wine_glass:",
    Movies: ":clapper:",
    Groceries: ":shopping_trolley:",
    "Eating Out": ":knife_fork_plate:",
    Shopping: ":shopping_bags:",
    Transport: ":train:",
    Travel: ":earth_africa:",
    Rent: ":house:",
    Utilities: ":zap:",
    Health: ":heart:",
  }).map(async ([id, emojiShortCode]) =>
    clientA.transaction.setCategoryEmojiShortCode.mutate({
      id,
      emojiShortCode,
    }),
  ),
);

console.log("Done");
