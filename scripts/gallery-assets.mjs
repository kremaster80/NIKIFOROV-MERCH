import fs from 'node:fs';
import path from 'node:path';

const html = fs.readFileSync('/tmp/nikiforov-pieces.html', 'utf8');
const items = [...html.matchAll(/<a class="piece__link"([\s\S]*?)<div class="lazy-image/g)].map((match, index) => {
  const chunk = match[1];
  const attr = (name) => chunk.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1] || '';
  const srcset = attr('data-gallery-srcset').replaceAll('&amp;', '&');
  const previews = srcset.split(',').map(s => s.trim().split(' '));
  return {
    index,
    file: attr('data-gallery-title'),
    id: attr('data-gallery-piece-id'),
    thumb: 'https:' + (previews[0]?.[0] || attr('data-gallery-src')),
    medium: 'https:' + (previews[1]?.[0] || attr('data-gallery-src')),
    full: 'https:' + attr('data-gallery-src'),
  };
});
const target = path.join(import.meta.dirname, 'gallery-index.json');
fs.writeFileSync(target, JSON.stringify(items, null, 2));
console.log(`Extracted ${items.length} source photographs into ${target}`);
