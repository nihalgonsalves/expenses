// @ts-check
/* eslint-env node */
/* eslint-disable import/no-extraneous-dependencies */

import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

import { context } from 'esbuild';

import packageJson from '../package.json' assert { type: 'json' };

/**
 * @param {string} path
 * @returns {string}
 */
export const relativePath = (path) =>
  fileURLToPath(new URL(path, import.meta.url).toString());

const ctx = await context({
  platform: 'node',
  bundle: true,
  outdir: relativePath('../dist/'),
  // some packages don't work well bundled, so we exclude them and install only
  // these specific packages later in the Dockerfile (see newPackage below)
  external: Object.keys(packageJson.resolutions),
  entryPoints: [relativePath('../src/app.ts')],
});

if (process.argv.includes('--watch')) {
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  const result = await ctx.rebuild();
  console.log(result);
  await ctx.dispose();

  const newPackage = {
    name: `${packageJson.name}_bundle`,
    version: packageJson.version,
    dependencies: packageJson.resolutions,
  };

  await writeFile(
    relativePath('../dist/package.json'),
    JSON.stringify(newPackage, null, 2),
    'utf-8',
  );
}
