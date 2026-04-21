import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'));

// @aws-sdk/* is provided by the Lambda Node 20 runtime; keep it external
// to hold bundle size well under the 2 MB budget.
const external = [...Object.keys(pkg.dependencies ?? {}).filter(n => n.startsWith('@aws-sdk/'))];

await build({
    entryPoints: [resolve(__dirname, 'src/handler.ts')],
    outfile: resolve(__dirname, 'dist/handler.js'),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    minify: true,
    sourcemap: 'external',
    treeShaking: true,
    external,
    logLevel: 'info'
});
