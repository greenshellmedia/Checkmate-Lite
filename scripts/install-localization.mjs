import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['node_modules', '.git', '.vs', '.verify', 'locales']);
let changed = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) install(full);
  }
}
function install(file) {
  let html = fs.readFileSync(file, 'utf8');
  const depth = path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = depth ? '../'.repeat(depth) : '';
  var additions = '';
  if (!html.includes('https://api.goaffpro.com/loader.js?shop=pmnkfjiswh')) additions += '  <script type="text/javascript" src="https://api.goaffpro.com/loader.js?shop=pmnkfjiswh"></script>\n';
  if (!html.includes('js/affiliate-attribution.js')) additions += `  <script src="${prefix}js/affiliate-attribution.js"></script>\n`;
  if (!html.includes('js/localization.js')) additions += `  <link rel="stylesheet" href="${prefix}localization/localization.css?v=1">\n  <script src="${prefix}js/localization.js"></script>\n`;
  if (!additions) return;
  html = html.replace('</head>', `${additions}</head>`);
  fs.writeFileSync(file, html, 'utf8');
  changed++;
}
walk(root);
console.log(`Installed localisation assets in ${changed} HTML files.`);
