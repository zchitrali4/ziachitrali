import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

const catalog = readFileSync(new URL('../src/previewCatalog.js', import.meta.url), 'utf8');
const ids = [...new Set([...catalog.matchAll(/photo-[a-z0-9-]+/g)].map((match) => match[0]))];
const dir = new URL('../../client/public/preview/', import.meta.url);
await mkdir(dir, { recursive: true });

let failed = 0;
await Promise.all(ids.map(async (id) => {
  const remote = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75`;
  const response = await fetch(remote, { redirect: 'follow' });
  if (!response.ok) {
    failed += 1;
    console.log('fail', id, response.status);
    return;
  }
  const file = new URL(`${id}.jpg`, dir);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  console.log('ok', id);
}));

if (failed) {
  console.error(`${failed} images failed`);
  process.exitCode = 1;
}
