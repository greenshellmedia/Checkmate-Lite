import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { targetLocales } from '../localization/config.mjs';
import { samePlaceholders } from './localization-lib.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'localization/source-catalogue.json'), 'utf8'));
const strict = process.argv.includes('--strict');
let failures = 0;
for (const locale of targetLocales) {
  const file = path.join(root, 'localization/locales', `${locale}.json`);
  const catalogue = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const missing = Object.keys(source).filter(key => !catalogue[key]?.trim());
  const unknown = Object.keys(catalogue).filter(key => !(key in source));
  const badPlaceholders = Object.keys(source).filter(key => catalogue[key] && !samePlaceholders(source[key], catalogue[key]));
  console.log(`${locale}: ${Object.keys(catalogue).length} translated, ${missing.length} missing, ${unknown.length} stale, ${badPlaceholders.length} placeholder errors.`);
  if (unknown.length || badPlaceholders.length || (strict && missing.length)) failures++;
}
if (failures) process.exitCode = 1;
