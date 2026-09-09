import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales, sourceLocale, targetLocales, localeFolder } from '../localization/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'localization/source-catalogue.json'), 'utf8'));
const sourceByText = new Map(Object.entries(source).map(([id, value]) => [value, id]));
const publicFiles = [];
const ignored = new Set(['node_modules', '.git', '.vs', '.verify', 'localization', ...targetLocales.map(localeFolder)]);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') publicFiles.push(full);
  }
}
walk(root);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function languageLinks(relative) {
  const route = relative === 'index.html' ? '/' : `/${path.dirname(relative).replaceAll('\\', '/')}/`;
  return [...locales.map(({ code }) => `<link rel="alternate" hreflang="${code}" href="https://checkmatemore.com${code === sourceLocale ? route : `/${localeFolder(code)}${route}`}">`), `<link rel="alternate" hreflang="x-default" href="https://checkmatemore.com${route}">`].join('\n  ');
}
function translateHtml(html, catalogue) {
  return [...sourceByText.entries()].sort((a, b) => b[0].length - a[0].length).reduce((result, [english, id]) => {
    const translated = catalogue[id];
    return translated ? result.replaceAll(english, translated) : result;
  }, html);
}
for (const file of publicFiles) {
  const relative = path.relative(root, file);
  const links = languageLinks(relative);
  let english = fs.readFileSync(file, 'utf8');
  if (!english.includes('hreflang=')) english = english.replace('</head>', `  ${links}\n</head>`);
  fs.writeFileSync(file, english, 'utf8');
  for (const locale of targetLocales) {
    const cataloguePath = path.join(root, 'localization/locales', `${locale}.json`);
    if (!fs.existsSync(cataloguePath)) throw new Error(`Missing ${locale} catalogue. Run translations.ps1 Generate first.`);
    const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
    const missing = Object.keys(source).filter(id => !catalogue[id]);
    if (missing.length) throw new Error(`${locale} catalogue is incomplete (${missing.length} strings missing).`);
    let html = translateHtml(english, catalogue)
      .replace('<html lang="en-GB"', `<html lang="${locale}" data-cmp-locale-default="${locale}"`)
      .replace(/(<link rel="canonical" href="https:\/\/checkmatemore\.com)(\/[^"']*)/i, `$1/${localeFolder(locale)}$2`)
      .replace(/\b(src|href)="(?:\.\.\/)*((?:assets|js|localization)\/[^"#?]+(?:[?#][^"]*)?)"/g, '$1="/$2"')
      .replace(/href="\/(?!\/|assets\/|js\/|localization\/|[a-z]+:)([^".#?]*\/)([^"]*)"/gi, `href="/${localeFolder(locale)}/$1$2"`);
    const destination = path.join(root, localeFolder(locale), relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, html, 'utf8');
  }
}
console.log(`Built ${publicFiles.length * targetLocales.length} static localised pages.`);
