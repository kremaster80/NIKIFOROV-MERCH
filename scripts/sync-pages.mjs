import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(projectRoot, 'dist');

for (const filename of ['index.html', 'styles.css', 'main.js']) {
  await cp(resolve(source, filename), resolve(projectRoot, filename));
}

await mkdir(resolve(projectRoot, 'assets'), { recursive: true });
await cp(resolve(source, 'assets'), resolve(projectRoot, 'assets'), { recursive: true });

console.log('GitHub Pages: файлы в корне проекта обновлены из dist/.');
