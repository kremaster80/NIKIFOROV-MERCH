import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const gallery = JSON.parse(await fs.readFile(new URL('./gallery-index.json', import.meta.url)));
const out = path.resolve(import.meta.dirname, '../dist/assets');
await fs.mkdir(out, {recursive:true});
const images = [
  ['hero', 462, 'full', 1800],
  ['campaign', 384, 'full', 1800],
  ['blue-camo', 48, 'full', 1100],
  ['pink', 72, 'full', 1100],
  ['black-red', 108, 'full', 1100],
  ['grey', 132, 'full', 1100],
  ['red', 174, 'full', 1100],
  ['purple', 198, 'full', 1100],
  ['navy', 222, 'full', 1100],
  ['turquoise', 288, 'full', 1100],
  ['yellow', 318, 'full', 1100],
  ['detail', 330, 'full', 1100],
  ['lifestyle', 396, 'full', 1500],
];
let i = 0;
await Promise.all(Array.from({length: 5},async()=>{
  while(i<images.length){
    const [name,index,quality,width] = images[i++];
    const item = gallery[index];
    const raw = path.join(out, `${name}-raw.jpg`);
    const target = path.join(out, `${name}.webp`);
    await run('curl',['-L','-sS','--retry','2','--max-time','60','-o',raw,item[quality]]);
    await run('convert',[raw,'-auto-orient','-resize',`${width}x`,'-quality','83',target]);
    await fs.unlink(raw);
    console.log(name,item.file,(await fs.stat(target)).size);
  }
}));
