import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localeDirs = new Set(['es', 'fr', 'de', 'pt-br', 'it', 'nl', 'pl', 'uk', 'ru']);
const files = [];
const errors = [];
const titles = new Map();
const descriptions = new Map();

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'localization' || entry.name === 'scripts' || localeDirs.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') files.push(full);
  }
}
walk(root);

const routeFor = file => {
  const relative = path.relative(root, file);
  return relative === 'index.html' ? '/' : `/${path.dirname(relative).replaceAll('\\', '/')}/`;
};
const expectedCanonical = route => `https://checkmatemore.com${route}`;
const recordUnique = (map, value, route, label) => {
  if (!value) return;
  if (map.has(value)) errors.push(`${route}: duplicate ${label} also used by ${map.get(value)}`);
  else map.set(value, route);
};

for (const file of files) {
  const route = routeFor(file);
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1]?.trim();
  recordUnique(titles, title, route, 'title');
  recordUnique(descriptions, description, route, 'meta description');
  if (!title) errors.push(`${route}: missing title`);
  if (!description) errors.push(`${route}: missing meta description`);
  if ((html.match(/<h1\b/gi) || []).length !== 1) errors.push(`${route}: expected exactly one H1`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (canonical !== expectedCanonical(route)) errors.push(`${route}: canonical is ${canonical || 'missing'}`);
  for (const field of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!new RegExp(`<meta property="${field}" content="[^"]+"`, 'i').test(html)) errors.push(`${route}: missing ${field}`);
  }
  for (const field of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!new RegExp(`<meta name="${field}" content="[^"]+"`, 'i').test(html)) errors.push(`${route}: missing ${field}`);
  }
  if (/noindex/i.test(html)) errors.push(`${route}: unexpected noindex`);
  if (html.includes('—')) errors.push(`${route}: contains an em dash`);
  if (/href="[^"]+\.html(?:[?#][^"]*)?"/i.test(html)) errors.push(`${route}: contains an .html link`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch (error) { errors.push(`${route}: invalid JSON-LD (${error.message})`); }
  }
  if (route.startsWith('/blog/') && route !== '/blog/') {
    if (!/"@type":\s*"BlogPosting"/.test(html)) errors.push(`${route}: missing BlogPosting data`);
    if (!/"@type":\s*"BreadcrumbList"/.test(html)) errors.push(`${route}: missing BreadcrumbList data`);
    if (!/<time datetime="2026-10-10">Published 10 October 2026<\/time>/.test(html)) errors.push(`${route}: publication date does not match visible content`);
  }
  const directory = path.dirname(file);
  for (const match of html.matchAll(/\bhref="([^"#?]+)(?:[?#][^"]*)?"/gi)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|\/\/)/i.test(value)) continue;
    let target = value.startsWith('/') ? path.join(root, value.replace(/^\/+/, '')) : path.resolve(directory, value);
    if (value.endsWith('/') || !path.extname(target)) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) errors.push(`${route}: broken local link ${value}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const file of files) {
  const url = expectedCanonical(routeFor(file));
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`sitemap: missing ${url}`);
}
if (sitemap.includes('/404')) errors.push('sitemap: 404 page must not be listed');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!/Sitemap:\s*https:\/\/checkmatemore\.com\/sitemap\.xml/i.test(robots)) errors.push('robots.txt: canonical sitemap declaration missing');
if (/Disallow:\s*\/blog/i.test(robots)) errors.push('robots.txt: blog is blocked');

if (errors.length) {
  console.error(errors.slice(0, 120).join('\n'));
  if (errors.length > 120) console.error(`...and ${errors.length - 120} more errors.`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} English pages: metadata, canonicals, JSON-LD, links, sitemap coverage and robots.txt.`);
}
