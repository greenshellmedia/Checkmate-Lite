const test = require('node:test');
const assert = require('node:assert/strict');
const attribution = require('../../js/affiliate-attribution.js');

test('collects affiliate and UTM parameters only', () => {
  assert.deepEqual(attribution.collect('?ref=alice&affiliate=club&sub_id=42&utm_source=newsletter&utm_campaign=launch&other=no'), {
    ref: 'alice', affiliate: 'club', sub_id: '42', utm_source: 'newsletter', utm_campaign: 'launch'
  });
});

test('normalises attribution parameter names', () => {
  assert.deepEqual(attribution.collect('?REF=alice&UTM_Source=email'), { ref: 'alice', utm_source: 'email' });
});

test('decorates CheckmateMore app links and preserves path, query and fragment', () => {
  const result = attribution.decorateHref('https://app.checkmatemore.com/featured?view=players#top', {
    ref: 'alice', utm_source: 'newsletter'
  }, 'https://checkmatemore.com/');
  assert.equal(result, 'https://app.checkmatemore.com/featured?view=players&ref=alice&utm_source=newsletter#top');
});

test('does not overwrite explicit destination attribution', () => {
  const result = attribution.decorateHref('https://app.checkmatemore.com/?ref=partner', { ref: 'landing', sub_id: '7' }, 'https://checkmatemore.com/');
  assert.equal(result, 'https://app.checkmatemore.com/?ref=partner&sub_id=7');
});

test('does not decorate unrelated hosts', () => {
  assert.equal(attribution.decorateHref('https://example.com/?x=1', { ref: 'alice' }, 'https://checkmatemore.com/'), 'https://example.com/?x=1');
});
