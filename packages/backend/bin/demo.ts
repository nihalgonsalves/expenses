import { faker } from "@faker-js/faker";
import { createAuthClient } from "better-auth/react";

import { getBackendWebApp } from "../src/web-context.ts";
import * as sheetApi from "../src/service/sheet/sheet-api.ts";
import * as transactionApi from "../src/service/transaction/transaction-api.ts";

const DEMO_A_EMAIL = "user@example.com";
const DEMO_B_EMAIL = "other-user@example.com";
const DEMO_PASSWORD = "password1234";
const BASE_URL = "http://localhost:5173";

await using backend = await getBackendWebApp();

const authClient = createAuthClient({
  baseURL: `${BASE_URL}/api/auth`,
  fetchOptions: {
    headers: { Origin: BASE_URL },
  },
});

const getContextForUser = async (user: {
  id: string;
  name: string;
  email: string;
}) => {
  const context = await backend.createContext({
    req: new Request(BASE_URL),
    resHeaders: new Headers(),
  });
  return {
    ...context,
    user: { id: user.id, name: user.name, email: user.email, theme: null },
  };
};

const createDemoUser = async (name: string, email: string) =>
  authClient.signUp.email(
    { name, email, password: DEMO_PASSWORD },
    { throw: true },
  );

const eur = (amountCents: number) => ({
  currencyCode: "EUR" as const,
  amount: amountCents,
  scale: 2,
});

const [{ user: userA }, { user: userB }] = await Promise.all([
  createDemoUser(
    `${faker.person.firstName()} ${faker.person.lastName()}`,
    DEMO_A_EMAIL,
  ),
  createDemoUser(
    `${faker.person.firstName()} ${faker.person.lastName()}`,
    DEMO_B_EMAIL,
  ),
]);

const contextA = await getContextForUser(userA);
const { id: personalSheetId } = await sheetApi.createPersonalSheet(contextA, {
  name: "Personal Expenses",
  currencyCode: "EUR",
});
const { id: groupSheetId } = await sheetApi.createGroupSheet(contextA, {
  name: "🌍 Berlin Trip",
  currencyCode: "EUR",
});

await sheetApi.addGroupSheetMember(contextA, {
  groupSheetId,
  name: userB.name,
  email: DEMO_B_EMAIL,
});

const spentAt = Temporal.Now.zonedDateTimeISO("Europe/Berlin").toString();

await transactionApi.batchCreatePersonalSheetTransactions(contextA, {
  personalSheetId,
  transactions: [
    { category: "Rent", min: 50, max: 100, multiplier: 1000 },
    { category: "Utilities", min: 50_00, max: 100_00, multiplier: 1 },
    { category: "Groceries", min: 20_00, max: 50_00, multiplier: 1 },
    { category: "Drinks", min: 10_00, max: 20_00, multiplier: 1 },
    { category: "Movies", min: 10_00, max: 20_00, multiplier: 1 },
    { category: "Eating Out", min: 25_00, max: 50_00, multiplier: 1 },
    { category: "Shopping", min: 100_00, max: 200_00, multiplier: 1 },
    { category: "Transport", min: 50_00, max: 100_00, multiplier: 1 },
    { category: "Travel", min: 200_00, max: 500_00, multiplier: 1 },
    { category: "Health", min: 10_00, max: 50_00, multiplier: 1 },
  ].map(({ category, min, max, multiplier }) => ({
    type: "EXPENSE" as const,
    category,
    description: "",
    money: eur(faker.number.int({ min, max }) * multiplier),
    spentAt,
  })),
});

const shareA = faker.number.int({ min: 75_00, max: 150_00 });
const shareB = faker.number.int({ min: 75_00, max: 150_00 });

await transactionApi.createGroupSheetTransaction(contextA, {
  groupSheetId,
  type: "EXPENSE",
  category: "Travel",
  description: "Train tickets",
  money: eur(shareA + shareB),
  spentAt,
  paidOrReceivedById: userA.id,
  splits: [
    { participantId: userA.id, share: eur(shareA) },
    { participantId: userB.id, share: eur(shareB) },
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
    transactionApi.setCategoryEmojiShortCode(contextA, {
      id,
      emojiShortCode,
    }),
  ),
);

console.log("Done");
