#!/usr/bin/env node

// @ts-check
/* eslint-env node */
/* eslint-disable import/no-extraneous-dependencies */
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

import { context } from 'esbuild';
import { z } from 'zod';

import packageJson from '../package.json' assert { type: 'json' };

/**
 * @param {string} path
 * @returns {string}
 */
export const relativePath = (path) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

const nodeEnv = z
  .union([z.literal('test'), z.literal('development'), z.literal('production')])
  .default('development')
  .parse(process.env.NODE_ENV);

const ctx = await context({
  platform: 'node',
  target: 'node20',
  bundle: true,
  treeShaking: true,
  minify: nodeEnv === 'production',
  sourcemap: true,
  outdir: relativePath('../dist/'),
  // some packages don't work well bundled, so we exclude them and install only
  // these specific packages later in the Dockerfile (see newPackage below)
  external: Object.keys(packageJson.resolutions),
  entryPoints: [relativePath('../src/app.ts')],
  define: {
    // must match `src/globals.d.ts` and `vitest.config.ts`
    IS_PROD: JSON.stringify(nodeEnv === 'production'),
  },
});

const newPackage = {
  name: `${packageJson.name}_bundle`,
  version: packageJson.version,
  dependencies: packageJson.resolutions,
};

if (process.argv.includes('--watch')) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  const result = await ctx.rebuild();
  console.log(result);
  await ctx.dispose();

  await writeFile(
    relativePath('../dist/package.json'),
    JSON.stringify(newPackage, null, 2),
    'utf-8',
  );
}
