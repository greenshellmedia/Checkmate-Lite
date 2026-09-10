import crypto from 'node:crypto';

export const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
export const keyFor = value => `auto.${hash(value).slice(0, 16)}`;
export const placeholders = value => [...String(value).matchAll(/\{\{[^{}]+\}\}|\{\d+\}|%[sdif]|\$\{[^{}]+\}/g)].map(match => match[0]).sort();
export const samePlaceholders = (a, b) => JSON.stringify(placeholders(a)) === JSON.stringify(placeholders(b));

export function protectPlaceholders(value) {
  const saved = [];
  return {
    text: String(value).replace(/https?:\/\/[^\s<>"']+|CheckmateMore|Chess\.com|Lichess|Stockfish|\{\{[^{}]+\}\}|\{\d+\}|%[sdif]|\$\{[^{}]+\}/gi, match => {
      const token = `__CMP_PLACEHOLDER_${saved.length}__`;
      saved.push(match);
      return token;
    }),
    restore: translated => saved.reduce((text, item, index) => text.replaceAll(`__CMP_PLACEHOLDER_${index}__`, item), translated)
  };
}

export function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

export function cleanEnvironmentValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export function azureTranslateEndpoint(value) {
  const configured = cleanEnvironmentValue(value) || 'https://api.cognitive.microsofttranslator.com';
  const endpoint = configured.replace(/\/+$/, '');
  const url = new URL(endpoint);
  const path = url.pathname.replace(/\/+$/, '');

  if (/\/(?:translate|translator\/text\/v3\.0\/translate)$/i.test(path)) return url.toString().replace(/\/$/, '');
  if (url.hostname.toLowerCase().endsWith('.cognitiveservices.azure.com')) {
    url.pathname = `${path}/translator/text/v3.0/translate`.replace(/\/+/g, '/');
  } else {
    url.pathname = `${path}/translate`.replace(/\/+/g, '/');
  }
  return url.toString().replace(/\/$/, '');
}
