import fs from 'node:fs';
import path from 'node:path';
import { targetLocales, localeFolder } from '../localization/config.mjs';

const root = path.resolve(import.meta.dirname, '..');
const ignored = new Set(['chess/app/index.html']);
const files = [];
const localizedDirectories = new Set(targetLocales.map(localeFolder));
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.vs', '.verify', '_tmp_chess'].includes(entry.name) || (dir === root && localizedDirectories.has(entry.name))) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') files.push(path.relative(root, full).replaceAll('\\', '/'));
  }
}
walk(root);

const errors = [];
const seen = { title: new Map(), description: new Map(), canonical: new Map() };
const one = (html, re) => html.match(re)?.[1]?.trim() || '';
const record = (kind, value, file) => {
  if (!value) errors.push(`${file}: missing ${kind}`);
  else if (seen[kind].has(value)) errors.push(`${file}: duplicate ${kind} with ${seen[kind].get(value)}`);
  else seen[kind].set(value, file);
};

for (const file of files) {
  if (ignored.has(file)) continue;
  const full = path.join(root, file);
  const html = fs.readFileSync(full, 'utf8');
  record('title', one(html, /<title>([^<]+)<\/title>/i), file);
  record('description', one(html, /<meta name="description" content="([^"]+)"/i), file);
  record('canonical', one(html, /<link rel="canonical" href="([^"]+)"/i), file);
  const h1s = [...html.matchAll(/<h1\b/gi)].length;
  if (h1s !== 1) errors.push(`${file}: expected 1 H1, found ${h1s}`);
  for (const required of ['og:title', 'og:description', 'og:image']) {
    if (!html.includes(`property="${required}"`)) errors.push(`${file}: missing ${required}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`${file}: duplicate IDs ${[...new Set(duplicates)].join(', ')}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${file}: invalid JSON-LD (${error.message})`); }
  }
  const dir = path.dirname(full);
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const url = match[1];
    if (/^(?:https?:|mailto:|data:)/i.test(url)) continue;
    let target = url.startsWith('/') ? path.join(root, url.replace(/^\/+/, '')) : path.resolve(dir, url);
    if (url.endsWith('/') || !path.extname(target)) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) errors.push(`${file}: missing local target ${url}`);
  }
  if (file.startsWith('research/') && file !== 'research/index.html') {
    for (const phrase of ['in our analysed sample', 'Corpus size', 'Date range', 'Included', 'Excluded', 'limitations', 'CheckmateMore editorial team']) {
      if (!html.toLowerCase().includes(phrase.toLowerCase())) errors.push(`${file}: missing research disclosure “${phrase}”`);
    }
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
for (const file of files.filter(file => !ignored.has(file))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const canonical = one(html, /<link rel="canonical" href="([^"]+)"/i);
  if (!sitemapUrls.includes(canonical)) errors.push(`sitemap: missing source canonical ${canonical}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.filter(file => !ignored.has(file)).length} public pages, ${sitemapUrls.length} sitemap URLs, unique metadata, JSON-LD, local links, and research disclosures.`);
}
