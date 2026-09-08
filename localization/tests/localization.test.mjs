import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLocale, targetLocales } from '../config.mjs';
import { keyFor, protectPlaceholders, samePlaceholders } from '../../scripts/localization-lib.mjs';
test('normalises exact, regional and unsupported locales', () => {
  assert.equal(normalizeLocale('pt_BR'), 'pt-BR');
  assert.equal(normalizeLocale('fr-CA'), 'fr');
  assert.equal(normalizeLocale('ja'), 'en-GB');
});
test('content keys are stable', () => assert.equal(keyFor('Analyse'), keyFor('Analyse')));
test('placeholder protection round trips', () => {
  const protectedValue = protectPlaceholders('Hello {0}, ${name}');
  assert.equal(protectedValue.restore(protectedValue.text), 'Hello {0}, ${name}');
  assert.equal(samePlaceholders('Hello {0}', 'Bonjour {0}'), true);
  assert.equal(samePlaceholders('Hello {0}', 'Bonjour'), false);
});
test('all requested target locales are configured', () => assert.deepEqual(targetLocales, ['es','fr','de','pt-BR','it','nl','pl','uk','ru']));
