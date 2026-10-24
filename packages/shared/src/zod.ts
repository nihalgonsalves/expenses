import { z } from "zod";

export const IS_PROD = process.env["NODE_ENV"] === "production";

export const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        // oxlint-disable-next-line typescript/no-unsafe-return
        return JSON.parse(jsonString);
      } catch (err) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err instanceof Error ? err.message : "",
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });
