import { injectManifest } from "workbox-build";
import { resolve } from "node:path";
import { build } from "vite";

import { fileURLToPath } from "node:url";

export const generateSw = async () => {
  const swBuildDir = fileURLToPath(new URL("../build/sw/", import.meta.url));

  await build({
    configFile: false,
    build: {
      outDir: swBuildDir,
      rollupOptions: {
        input: "src/sw.ts",
        output: {
          format: "es",
          entryFileNames: "sw-src.js",
        },
      },
    },
  });

  try {
    const publicDirectory = fileURLToPath(
      new URL("../.output/public/", import.meta.url),
    );

    const { count, size, warnings } = await injectManifest({
      swSrc: resolve(swBuildDir, "sw-src.js"),
      swDest: resolve(publicDirectory, "sw.js"),
      globDirectory: publicDirectory,
      globPatterns: ["**/*.{js,css,ico,png,svg,woff2}"],
      globIgnores: ["sw-src.js", "sw.js"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    });

    if (warnings.length > 0) {
      console.warn("Warnings:", warnings.join("\n"));
    }

    console.log(
      `✓ Service worker generated with ${count} files, totaling ${(size / 1024).toFixed(1)} KB`,
    );
  } catch (error) {
    console.error("Error generating service worker:", error);
    process.exit(1);
  }
};
