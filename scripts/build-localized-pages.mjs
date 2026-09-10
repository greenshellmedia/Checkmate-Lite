import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { locales, sourceLocale, targetLocales, localeFolder } from '../localization/config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://checkmatemore.com';
const source = JSON.parse(fs.readFileSync(path.join(root, 'localization/source-catalogue.json'), 'utf8'));
const keyByEnglish = new Map(Object.entries(source).map(([id, value]) => [value, id]));
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

const routeFor = relative => relative === 'index.html' ? '/' : `/${path.dirname(relative).replaceAll('\\', '/')}/`;
const localizedRoute = (route, locale) => locale === sourceLocale ? route : `/${localeFolder(locale)}${route}`;
const absoluteUrl = (route, locale) => `${origin}${localizedRoute(route, locale)}`;
const translateExact = (value, catalogue) => {
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const id = keyByEnglish.get(value.trim());
  return id && catalogue[id] ? `${leading}${catalogue[id]}${trailing}` : value;
};
function translateJsonLd(block, catalogue) {
  try {
    const visit = value => {
      if (Array.isArray(value)) return value.map(visit);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]));
      if (typeof value !== 'string' || /^(?:https?:|mailto:)/i.test(value)) return value;
      return translateExact(value, catalogue);
    };
    return `\n${JSON.stringify(visit(JSON.parse(block)), null, 2)}\n`;
  } catch { return block; }
}
function translateHtml(english, catalogue) {
  const protectedBlocks = [];
  let html = english.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, block => {
    const translated = /type=["']application\/ld\+json["']/i.test(block)
      ? block.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/i, (_, open, json, close) => `${open}${translateJsonLd(json, catalogue)}${close}`)
      : block;
    const token = `___CMP_PROTECTED_BLOCK_${protectedBlocks.length}___`;
    protectedBlocks.push(translated);
    return token;
  });
  html = html.replace(/(^|>)([^<>]+)(?=<|$)/g,
    (_, boundary, text) => `${boundary}${translateExact(text, catalogue)}`);
  html = html.replace(/\b(title|aria-label|placeholder|alt)="([^"]*)"/gi,
    (_, name, value) => `${name}="${translateExact(value, catalogue)}"`);
  html = html.replace(/(<meta\s+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"\s+content=")([^"]*)(")/gi,
    (_, open, value, close) => `${open}${translateExact(value, catalogue)}${close}`);
  protectedBlocks.forEach((block, index) => { html = html.replace(`___CMP_PROTECTED_BLOCK_${index}___`, block); });
  return html;
}
function languageLinks(route) {
  return [...locales.map(({ code }) => `<link rel="alternate" hreflang="${code}" href="${absoluteUrl(route, code)}">`),
    `<link rel="alternate" hreflang="x-default" href="${absoluteUrl(route, sourceLocale)}">`].join('\n  ');
}
function setLanguageLinks(html, route) {
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+">/gi, '');
  return html.replace('</head>', `  ${languageLinks(route)}\n</head>`);
}
function localizeNavigation(html, locale, route) {
  const prefix = localeFolder(locale);
  return html.replace(/<(?:a|script|img|link)\b[^>]*>/gi, tag => {
    if (/<link\b/i.test(tag) && /\brel="(?:canonical|alternate)"/i.test(tag)) return tag;
    return tag.replace(/\b(src|href)="([^"]+)"/gi, (attribute, name, value) => {
      if (/^(?:https?:|mailto:|data:|#|\/\/)/i.test(value)) return attribute;
      const resolved = new URL(value, `${origin}${route}`);
      const suffix = `${resolved.search}${resolved.hash}`;
      if (name.toLowerCase() === 'src' || path.posix.extname(resolved.pathname)) return `${name}="${resolved.pathname}${suffix}"`;
      const pagePath = resolved.pathname.startsWith(`/${prefix}/`) ? resolved.pathname : `/${prefix}${resolved.pathname}`;
      return `${name}="${pagePath}${suffix}"`;
    });
  });
}

const built = [];
for (const file of publicFiles) {
  const relative = path.relative(root, file);
  const route = routeFor(relative);
  const english = setLanguageLinks(fs.readFileSync(file, 'utf8'), route);
  fs.writeFileSync(file, english, 'utf8');
  built.push({ locale: sourceLocale, route });
  for (const locale of targetLocales) {
    const cataloguePath = path.join(root, 'localization/locales', `${locale}.json`);
    if (!fs.existsSync(cataloguePath)) throw new Error(`Missing ${locale} catalogue. Run translations.ps1 Generate first.`);
    const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
    const missing = Object.keys(source).filter(id => !catalogue[id]);
    if (missing.length) throw new Error(`${locale} catalogue is incomplete (${missing.length} strings missing).`);
    let html = translateHtml(english, catalogue)
      .replace('<html lang="en-GB"', `<html lang="${locale}" data-cmp-locale-default="${locale}"`)
      .replace(/<link rel="canonical" href="[^"]+">/i, `<link rel="canonical" href="${absoluteUrl(route, locale)}">`)
      .replace(/(<meta property="og:url" content=")[^"]+(">)/i, `$1${absoluteUrl(route, locale)}$2`);
    html = localizeNavigation(html, locale, route);
    const destination = path.join(root, localeFolder(locale), relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, html, 'utf8');
    built.push({ locale, route });
  }
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemapEntries = built.map(({ locale, route }) => `  <url>\n    <loc>${absoluteUrl(route, locale)}</loc>\n${locales.map(({ code }) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${absoluteUrl(route, code)}"/>`).join('\n')}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(route, sourceLocale)}"/>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
fs.writeFileSync(path.join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapEntries.join('\n')}\n</urlset>\n`, 'utf8');
console.log(`Built ${built.length} canonical pages and a ${built.length}-URL multilingual sitemap.`);
