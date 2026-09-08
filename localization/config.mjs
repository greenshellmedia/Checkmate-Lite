export const sourceLocale = 'en-GB';
export const locales = [
  { code: 'en-GB', label: 'English', short: 'EN' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'pt-BR', label: 'Português (Brasil)', short: 'PT' },
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'nl', label: 'Nederlands', short: 'NL' },
  { code: 'pl', label: 'Polski', short: 'PL' },
  { code: 'uk', label: 'Українська', short: 'UK' },
  { code: 'ru', label: 'Русский', short: 'RU' }
];
export const targetLocales = locales.filter(({ code }) => code !== sourceLocale).map(({ code }) => code);
export const localeFolder = code => code.toLowerCase();

export function normalizeLocale(value) {
  const candidate = String(value || '').trim().replace('_', '-').toLowerCase();
  if (!candidate) return sourceLocale;
  const exact = locales.find(({ code }) => code.toLowerCase() === candidate);
  if (exact) return exact.code;
  const language = candidate.split('-')[0];
  return locales.find(({ code }) => code.toLowerCase().split('-')[0] === language)?.code || sourceLocale;
}
