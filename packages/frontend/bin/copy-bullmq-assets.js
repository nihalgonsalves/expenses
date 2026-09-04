import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = dirname(fileURLToPath(import.meta.url));
const bullMqCommandsDirectory = join(
  frontendDirectory,
  "../../backend/node_modules/bullmq/dist/esm/postgres/commands",
);
const outputCommandsDirectory = join(
  frontendDirectory,
  "../.output/server/_ssr/commands",
);

mkdirSync(outputCommandsDirectory, { recursive: true });

for (const fileName of readdirSync(bullMqCommandsDirectory)) {
  if (fileName.endsWith(".sql")) {
    cpSync(
      join(bullMqCommandsDirectory, fileName),
      join(outputCommandsDirectory, fileName),
    );
  }
}
