import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, keyFor } from './localization-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'localization');
const ignoredDirs = new Set(['.git', '.github', '.vs', '.verify', 'node_modules', 'localization', 'scripts', 'es', 'fr', 'de', 'pt-br', 'it', 'nl', 'pl', 'uk', 'ru']);
const entries = new Map();
const provenance = {};
const shouldKeep = text => {
  const value = text.replace(/\s+/g, ' ').trim();
  if (value.length < 2 || !/[A-Za-zÀ-ž]/.test(value)) return false;
  if (/^(?:https?:|mailto:|\/|\.\/|\.\.\/|[.#][\w-]+$)/i.test(value)) return false;
  if (/^[a-hKQRBN0-9+#=xO\-–\s.]+$/.test(value)) return false;
  if (/^[\w.-]+\.(?:js|css|json|html|svg|png|ico)$/i.test(value)) return false;
  if (/\$\{|=>|\.map\(|\.join\(|\+\s*[\w"']|[\w"']\s*\+|\b(?:request|response|document|window)\.[A-Za-z]/.test(value)) return false;
  return true;
};
const add = (raw, file, context) => {
  const placeholderIds = new Map();
  const text = raw.replace(/\{\d+\}/g, token => {
    if (!placeholderIds.has(token)) placeholderIds.set(token, placeholderIds.size);
    return `{${placeholderIds.get(token)}}`;
  }).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  if (!shouldKeep(text)) return;
  const key = keyFor(text);
  entries.set(key, text);
  (provenance[key] ||= []).push({ file, context });
};
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:html|js)$/i.test(entry.name) && !entry.name.endsWith('.min.js')) extract(full);
  }
}
function extract(full) {
  const file = path.relative(root, full).replaceAll('\\', '/');
  const source = fs.readFileSync(full, 'utf8');
  if (file.endsWith('.html')) {
    const clean = source.replace(/<(?:style|svg|script)[\s\S]*?<\/(?:style|svg|script)>/gi, '');
    for (const match of clean.matchAll(/>([^<>]+)</g)) add(match[1], file, 'text');
    for (const match of clean.matchAll(/\b(?:title|aria-label|placeholder|alt)="([^"]+)"/gi)) add(match[1], file, match[0].split('=')[0]);
    for (const match of source.matchAll(/<meta\s+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"\s+content="([^"]+)"/gi)) add(match[1], file, 'metadata');
    for (const match of source.matchAll(/"(?:name|description|headline|text)"\s*:\s*"([^"]+)"/g)) add(match[1], file, 'json-ld');
  } else {
    for (const match of source.matchAll(/(?:textContent|innerText|innerHTML|title|placeholder|ariaLabel|message|description|label|status)\s*(?:=|:)\s*([`'"])([\s\S]*?)\1/g)) {
      let template = match[2];
      if (match[1] === '`') {
        let rendered = '', placeholder = 0;
        for (let i = 0; i < template.length; i++) {
          if (template[i] === '$' && template[i + 1] === '{') {
            let depth = 1; i += 2;
            while (i < template.length && depth) { if (template[i] === '{') depth++; else if (template[i] === '}') depth--; i++; }
            rendered += `{${placeholder++}}`; i--;
          } else rendered += template[i];
        }
        template = rendered;
      }
      template.split(/<[^>]+>/g).forEach(text => add(text, file, 'script-string'));
    }
  }
}
walk(root);
fs.mkdirSync(outputDir, { recursive: true });
const catalogue = Object.fromEntries([...entries].sort((a, b) => a[1].localeCompare(b[1], 'en-GB')));
for (const key of Object.keys(provenance)) provenance[key] = [...new Map(provenance[key].map(item => [JSON.stringify(item), item])).values()];
fs.writeFileSync(path.join(outputDir, 'source-catalogue.json'), `${JSON.stringify(catalogue, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'source-catalogue.js'), `window.__CMP_SOURCE_CATALOGUE__=${JSON.stringify(catalogue)};\n`);
fs.writeFileSync(path.join(outputDir, 'source-provenance.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceHash: hash(JSON.stringify(catalogue)), entries: provenance }, null, 2)}\n`);
console.log(`Extracted ${Object.keys(catalogue).length} unique English strings.`);
