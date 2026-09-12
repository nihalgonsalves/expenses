import { createRequire } from "node:module";

import { createPrisma } from "../src/create-prisma.ts";

type EmojiData = {
  aliases: Record<string, string>;
  emojis: Record<string, { skins: { native: string }[] }>;
};

const require = createRequire(import.meta.url);
const dataValue: unknown = require("@emoji-mart/data");
const isEmojiData = (value: unknown): value is EmojiData =>
  typeof value === "object" &&
  value !== null &&
  "aliases" in value &&
  "emojis" in value;
if (!isEmojiData(dataValue)) throw new Error("Invalid emoji-mart data");
const data = dataValue;
const prisma = createPrisma();

let converted = 0;
let skipped = 0;
const unresolved: { id: string; userId: string; shortCode: string }[] = [];

try {
  const categories = await prisma.category.findMany({
    where: { emoji: null },
    select: { id: true, userId: true, emojiShortCode: true },
  });

  await Promise.all(
    categories.map(async (category) => {
      const shortCode = category.emojiShortCode.trim();
      if (!shortCode) {
        skipped++;
        return;
      }

      const key = shortCode.replace(/^:/, "").replace(/:$/, "");
      const id = data.aliases[key] ?? key;
      const native = data.emojis[id]?.skins[0]?.native;
      if (!native) {
        unresolved.push({
          id: category.id,
          userId: category.userId,
          shortCode,
        });
        return;
      }

      const result = await prisma.category.updateMany({
        where: { id: category.id, userId: category.userId, emoji: null },
        data: { emoji: native },
      });
      if (result.count === 1) converted++;
      else skipped++;
    }),
  );
} finally {
  await prisma.$disconnect();
}

console.log(
  `Emoji migration: ${converted} converted, ${skipped} skipped, ${unresolved.length} unresolved`,
);
if (unresolved.length > 0) {
  for (const category of unresolved) {
    console.error(`${category.userId}/${category.id}: ${category.shortCode}`);
  }
  process.exitCode = 1;
}
