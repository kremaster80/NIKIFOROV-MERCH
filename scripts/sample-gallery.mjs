import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
const run = promisify(execFile);
const assets = JSON.parse(await fs.readFile(new URL('./gallery-index.json', import.meta.url)));
const out = '/tmp/nikiforov-thumbs';
await fs.mkdir(out, { recursive: true });
const selected = assets.filter((_, i) => i % 6 === 0);
let next = 0, ok = 0, failed = 0;
await Promise.all(Array.from({length: 12}, async () => {
  while (next < selected.length) {
    const item = selected[next++];
    const dest = path.join(out, `${String(item.index).padStart(3,'0')}.jpg`);
    try {
      await run('curl', ['-L','-sS','--max-time','28','-o',dest,item.thumb]);
      const stat = await fs.stat(dest);
      if (stat.size < 1000) throw new Error('small image');
      ok++;
    } catch(e) { failed++; }
  }
}));
console.log({total:selected.length,ok,failed,out});
