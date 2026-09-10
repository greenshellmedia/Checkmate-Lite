import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { targetLocales } from '../localization/config.mjs';
import { sleep } from './localization-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'localization/source-catalogue.json'), 'utf8'));
const manifestPath = path.join(root, 'localization/translation-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const replacements = {
  es: [/Jaque\s*mate\s*Más/gi, /CheckmateMás/gi, /Checkmate\s+Más/gi],
  fr: [/Échec\s*et\s*mat\s*Plus/gi, /Checkmate\s*Plus/gi, /CheckmatMore/gi],
  de: [/Schachmatt\s*Mehr/gi, /CheckmatMore/gi],
  'pt-BR': [/Xeque[- ]?mate\s*Mais/gi, /XequemateMais/gi, /Checkmate\s+Mais/gi],
  it: [/Scacco\s*matto\s*Più/gi, /Scaccomate\s*Più/gi, /Checkmate\s+Più/gi],
  nl: [/Schaakmat\s*Meer/gi, /CheckmatMore/gi],
  pl: [/Szach[- ]?mat\s*(?:Więcej|More)/gi, /Checkmate\s*Więcej/gi, /CheckmateWięcej/gi],
  uk: [/Шах\s*і\s*мат\s*Більше/gi, /CheckmateЩе/gi],
  ru: [/Шах\s*и\s*мат\s*Больше/gi]
};
async function writeWithRetry(file, value) {
  let lastError;
  for (let attempt = 0; attempt < 6; attempt++) {
    try { await fs.promises.writeFile(file, value, 'utf8'); return; }
    catch (error) {
      lastError = error;
      if (!['EBUSY', 'EPERM', 'EACCES', 'UNKNOWN'].includes(error.code) || attempt === 5) break;
      await sleep(200 * (attempt + 1));
    }
  }
  throw lastError;
}

for (const locale of targetLocales) {
  const file = path.join(root, 'localization/locales', `${locale}.json`);
  const catalogue = JSON.parse(fs.readFileSync(file, 'utf8'));
  let repaired = 0;
  let fallback = 0;
  for (const [id, english] of Object.entries(source)) {
    const expected = (english.match(/CheckmateMore/g) || []).length;
    if (!expected || !catalogue[id]) continue;
    let translated = catalogue[id];
    for (const pattern of replacements[locale] || []) translated = translated.replace(pattern, 'CheckmateMore');
    translated = translated.replace(/Checkmate(?=[\u0400-\u04ff])/g, 'CheckmateMore');
    const actual = (translated.match(/CheckmateMore/g) || []).length;
    if (actual !== expected) {
      translated = english;
      fallback++;
    }
    if (translated !== catalogue[id]) {
      catalogue[id] = translated;
      repaired++;
      if (manifest.entries?.[`${locale}:${id}`]) manifest.entries[`${locale}:${id}`].provider = actual === expected ? 'manual-protected-term' : 'english-fallback';
    }
  }
  await writeWithRetry(file, `${JSON.stringify(catalogue, null, 2)}\n`);
  await writeWithRetry(path.join(root, 'localization/locales', `${locale}.js`), `window.__CMP_LOCALE_CATALOGUES__=window.__CMP_LOCALE_CATALOGUES__||{};window.__CMP_LOCALE_CATALOGUES__[${JSON.stringify(locale)}]=${JSON.stringify(catalogue)};\n`);
  console.log(`${locale}: repaired ${repaired} protected-brand entries; ${fallback} use the English fallback.`);
}
await writeWithRetry(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
