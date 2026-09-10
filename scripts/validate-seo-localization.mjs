import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales, sourceLocale, targetLocales, localeFolder } from '../localization/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://checkmatemore.com';
const source = JSON.parse(fs.readFileSync(path.join(root, 'localization/source-catalogue.json'), 'utf8'));
const ignored = new Set(['node_modules', '.git', '.vs', '.verify', 'localization', ...targetLocales.map(localeFolder)]);
const sourceFiles = [];
const errors = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') sourceFiles.push(full);
  }
}
walk(root);
const routeFor = file => {
  const relative = path.relative(root, file);
  return relative === 'index.html' ? '/' : `/${path.dirname(relative).replaceAll('\\', '/')}/`;
};
const expectedUrl = (route, locale) => `${origin}${locale === sourceLocale ? route : `/${localeFolder(locale)}${route}`}`;
const expectedUrls = new Set();
for (const sourceFile of sourceFiles) {
  const relative = path.relative(root, sourceFile);
  const route = routeFor(sourceFile);
  for (const { code } of locales) {
    const file = code === sourceLocale ? sourceFile : path.join(root, localeFolder(code), relative);
    const url = expectedUrl(route, code);
    expectedUrls.add(url);
    if (!fs.existsSync(file)) { errors.push(`${code}/${route}: missing HTML file`); continue; }
    const html = fs.readFileSync(file, 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/i)?.[1];
    if (canonical !== url) errors.push(`${code}/${route}: canonical is ${canonical || 'missing'}, expected ${url}`);
    const lang = html.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1];
    if (lang !== code) errors.push(`${code}/${route}: html lang is ${lang || 'missing'}`);
    const alternates = new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/gi)].map(match => [match[1], match[2]]));
    for (const alternate of locales) {
      const expected = expectedUrl(route, alternate.code);
      if (alternates.get(alternate.code) !== expected) errors.push(`${code}/${route}: bad hreflang ${alternate.code}`);
    }
    if (alternates.get('x-default') !== expectedUrl(route, sourceLocale)) errors.push(`${code}/${route}: bad hreflang x-default`);
    for (const match of html.matchAll(/https:\/\/([^/"'<\s]+)/gi)) {
      const hostname = match[1].toLowerCase();
      if (hostname.startsWith('checkmate') && !['checkmatemore.com', 'app.checkmatemore.com'].includes(hostname)) errors.push(`${code}/${route}: corrupted CheckmateMore hostname ${hostname}`);
    }
    const fileDir = path.dirname(file);
    for (const match of html.matchAll(/\b(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/gi)) {
      const value = match[1];
      if (/^(?:https?:|mailto:|data:|\/\/)/i.test(value)) continue;
      let target = value.startsWith('/') ? path.join(root, value.replace(/^\/+/, '')) : path.resolve(fileDir, value);
      if (value.endsWith('/') || !path.extname(target)) target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) errors.push(`${code}/${route}: missing local target ${value}`);
    }
  }
}
for (const locale of targetLocales) {
  const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'localization/locales', `${locale}.json`), 'utf8'));
  for (const [id, english] of Object.entries(source)) {
    const expectedBrands = (english.match(/CheckmateMore/g) || []).length;
    const actualBrands = (String(catalogue[id] || '').match(/CheckmateMore/g) || []).length;
    if (expectedBrands !== actualBrands) errors.push(`${locale}/${id}: CheckmateMore brand count changed (${expectedBrands} to ${actualBrands})`);
  }
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const sitemapSet = new Set(sitemapUrls);
for (const url of expectedUrls) if (!sitemapSet.has(url)) errors.push(`sitemap: missing ${url}`);
for (const url of sitemapSet) if (!expectedUrls.has(url)) errors.push(`sitemap: unexpected ${url}`);
if (sitemapUrls.length !== sitemapSet.size) errors.push('sitemap: duplicate <loc> entries');
if (errors.length) {
  console.error(errors.slice(0, 100).join('\n'));
  if (errors.length > 100) console.error(`...and ${errors.length - 100} more errors.`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${expectedUrls.size} canonical pages, reciprocal hreflang clusters, protected branding and complete sitemap coverage.`);
}
