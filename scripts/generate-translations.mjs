import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { targetLocales } from '../localization/config.mjs';
import { hash, protectPlaceholders, sleep } from './localization-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const prune = args.has('--prune');
const pruneOnly = args.has('--prune-only');
const source = JSON.parse(fs.readFileSync(path.join(root, 'localization/source-catalogue.json'), 'utf8'));
const dir = path.join(root, 'localization/locales');
const manifestPath = path.join(root, 'localization/translation-manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { version: 1, entries: {} };
const key = process.env.AZURE_TRANSLATOR_KEY;
const region = process.env.AZURE_TRANSLATOR_REGION;
const endpoint = (process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com').replace(/\/$/, '');
const batchSize = Math.max(1, Math.min(100, Number(process.env.TRANSLATION_BATCH_SIZE || 50)));
const paceMs = Math.max(0, Number(process.env.TRANSLATION_PACE_MS || 250));
const maximumBatchCharacters = Math.max(1000, Math.min(45000, Number(process.env.AZURE_TRANSLATOR_BATCH_CHARACTERS || 12000)));
const maximumCharacters = Math.max(1000, Number(process.env.AZURE_TRANSLATOR_MAX_CHARACTERS || 1900000));
const targetLanguage = locale => locale === 'pt-BR' ? 'pt' : locale;

async function translateBatch(items, locale) {
  const protectedItems = items.map(({ value }) => protectPlaceholders(value));
  const url = `${endpoint}/translate?api-version=3.0&from=en&to=${encodeURIComponent(targetLanguage(locale))}`;
  let lastNetworkError;
  for (let attempt = 0; attempt < 9; attempt++) {
    let response;
    try {
      response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': key, ...(region ? { 'Ocp-Apim-Subscription-Region': region } : {}), 'X-ClientTraceId': randomUUID() }, body: JSON.stringify(protectedItems.map(item => ({ Text: item.text }))) });
      lastNetworkError = undefined;
    } catch (error) {
      lastNetworkError = error;
      if (attempt === 8) break;
      const backoff = Math.min(60000, 5000 * (2 ** attempt));
      console.warn(`[${locale}] Could not connect to Azure Translator (${error.cause?.code || error.code || error.message}). Saved progress is safe; retrying in ${Math.ceil(backoff / 1000)}s (attempt ${attempt + 2}/9).`);
      await sleep(backoff);
      continue;
    }
    if (response.ok) {
      const data = await response.json();
      const translated = data.map((item, index) => protectedItems[index].restore(item.translations?.[0]?.text || ''));
      return translated;
    }
    const body = await response.text();
    if (response.status !== 429 && response.status < 500) throw new Error(`Azure Translator returned ${response.status}: ${body}`);
    if (attempt === 8) throw new Error(`Azure Translator returned ${response.status} after 9 attempts: ${body}`);
    const retryAfter = Number(response.headers.get('retry-after')) * 1000;
    const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : Math.min(60000, 5000 * (2 ** attempt));
    console.warn(`[${locale}] Azure returned ${response.status}. Saved progress is safe; retrying in ${Math.ceil(backoff / 1000)}s (attempt ${attempt + 2}/9).`);
    await sleep(backoff);
  }
  if (lastNetworkError) throw new Error(`Could not connect to Azure Translator at ${endpoint} after 9 attempts (${lastNetworkError.cause?.code || lastNetworkError.code || lastNetworkError.message}). Check the endpoint, firewall/VPN and proxy settings. If this Azure resource uses a custom endpoint, set AZURE_TRANSLATOR_ENDPOINT to it.`, { cause: lastNetworkError });
  throw new Error('Azure Translator did not recover after 9 attempts.');
}

fs.mkdirSync(dir, { recursive: true });
const pendingCharacters = targetLocales.reduce((sum, locale) => {
  const file = path.join(dir, `${locale}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  return sum + Object.entries(source).filter(([id, value]) => !existing[id] || manifest.entries[`${locale}:${id}`]?.sourceHash !== hash(value)).reduce((localeSum, [, value]) => localeSum + value.length, 0);
}, 0);
console.log(`${Object.keys(source).length} strings; ${pendingCharacters.toLocaleString()} translated characters.`);
if (!dryRun && !pruneOnly && pendingCharacters > maximumCharacters) throw new Error(`Translation requires ${pendingCharacters.toLocaleString()} characters, above AZURE_TRANSLATOR_MAX_CHARACTERS (${maximumCharacters.toLocaleString()}).`);
for (const locale of targetLocales) {
  const file = path.join(dir, `${locale}.json`);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const next = prune ? Object.fromEntries(Object.entries(existing).filter(([id]) => id in source)) : { ...existing };
  const pending = Object.entries(source).filter(([id, value]) => !next[id] || manifest.entries[`${locale}:${id}`]?.sourceHash !== hash(value));
  console.log(`${locale}: ${pending.length} pending, ${Object.keys(next).length} retained.`);
  if (!dryRun && !pruneOnly && pending.length && !key) throw new Error('AZURE_TRANSLATOR_KEY is required when translations are pending.');
  if (!dryRun && !pruneOnly) for (let start = 0; start < pending.length;) {
    const batch = [];
    let batchCharacters = 0;
    while (start < pending.length && batch.length < batchSize && (batch.length === 0 || batchCharacters + pending[start][1].length <= maximumBatchCharacters)) {
      batch.push(pending[start++]);
      batchCharacters += batch.at(-1)[1].length;
    }
    const translated = await translateBatch(batch.map(([id, value]) => ({ id, value })), locale);
    batch.forEach(([id, value], index) => {
      if (!translated[index]?.trim()) {
        console.warn(`[${locale}] Skipped ${id} because Azure returned an empty translation. It will remain pending.`);
        return;
      }
      next[id] = translated[index];
      manifest.entries[`${locale}:${id}`] = { sourceHash: hash(value), translatedAt: new Date().toISOString(), provider: 'azure' };
    });
    fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
    fs.writeFileSync(path.join(dir, `${locale}.js`), `window.__CMP_LOCALE_CATALOGUES__=window.__CMP_LOCALE_CATALOGUES__||{};window.__CMP_LOCALE_CATALOGUES__[${JSON.stringify(locale)}]=${JSON.stringify(next)};\n`);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`[${locale}] Saved ${Math.min(start, pending.length)}/${pending.length} pending entries.`);
    if (paceMs) await sleep(paceMs);
  }
  if (!dryRun && pruneOnly) fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
}
if (!dryRun) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  for (const locale of targetLocales) {
    const file = path.join(dir, `${locale}.json`);
    if (fs.existsSync(file)) {
      const catalogue = JSON.parse(fs.readFileSync(file, 'utf8'));
      fs.writeFileSync(path.join(dir, `${locale}.js`), `window.__CMP_LOCALE_CATALOGUES__=window.__CMP_LOCALE_CATALOGUES__||{};window.__CMP_LOCALE_CATALOGUES__[${JSON.stringify(locale)}]=${JSON.stringify(catalogue)};\n`);
    }
  }
}
