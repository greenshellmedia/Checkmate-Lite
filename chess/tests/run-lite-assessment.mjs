#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);
const scoring = require('../../js/chess/scoring.js');

function move(label, cp = 20, extra = {}) {
    return { classification: { label }, evalDeltaCp: cp, engineReliable: true, moveThemes: [], ...extra };
}

function stats(moves, accuracy, avgCpl) {
    const counts = {};
    for (const m of moves) counts[m.classification.label] = (counts[m.classification.label] || 0) + 1;
    return { moves, counts, ratedN: moves.length, total: moves.length, accuracy, avgCpl };
}

function phases(opening, middlegame, endgame = null) {
    const seg = (stars, n) => stars == null
        ? { reached: false, stars: null, total: 0, ratedN: 0, counts: {} }
        : { reached: true, stars, total: n, ratedN: n, counts: {} };
    return { segments: { opening: seg(opening, 6), middlegame: seg(middlegame, 10), endgame: seg(endgame, 8) } };
}

// Clean, broad sample should outrank a blunder-filled one without claiming title strength.
const cleanMoves = Array.from({ length: 22 }, (_, i) => move(i % 4 ? 'Best' : 'Excellent', 8));
const clean = scoring.buildSideAssessment(stats(cleanMoves, 96, 8), phases(5, 5, 4), { opponentRating: 1650 });
assert.equal(clean.level.confidence, 'High');
assert.ok(clean.level.value >= 1750 && clean.level.value <= 2250);

const badMoves = Array.from({ length: 20 }, (_, i) => move(i % 2 ? 'Blunder' : 'Mistake', 260));
const bad = scoring.buildSideAssessment(stats(badMoves, 38, 260), phases(2, 1, 1), { opponentRating: 1200 });
assert.ok(bad.level.value < clean.level.value);

// Tactical hangs must reduce the estimate relative to otherwise identical errors.
const tacticalMoves = Array.from({ length: 12 }, () => move('Good', 35));
tacticalMoves[4] = move('Blunder', 320, { materialEvent: { kind: 'hang' }, moveThemes: ['hung_piece'] });
const tactical = scoring.buildSideAssessment(stats(tacticalMoves, 76, 58), phases(4, 3));
const quietMoves = tacticalMoves.map(m => ({ ...m, materialEvent: null, moveThemes: [] }));
const quiet = scoring.buildSideAssessment(stats(quietMoves, 76, 58), phases(4, 3));
assert.ok(tactical.level.value < quiet.level.value);

// A book-heavy game has few meaningful moves and therefore low confidence; absent endgame is excluded.
const short = scoring.buildSideAssessment(stats([move('Best'), move('Good'), move('Inaccuracy')], 84, 42), phases(4, 3, null));
assert.equal(short.level.confidence, 'Low');
assert.equal(short.phases.endgame.stars, null);
assert.match(short.phases.endgame.explanation, /excluded/i);

// Missed mate can never retain a positive label.
for (const label of ['Great', 'Best', 'Excellent', 'Good']) {
    assert.equal(scoring.normalizeMissedMateClassification({ label, class: 'positive' }, true).label, 'Miss');
}

// Lightweight enough to run repeatedly in a browser review.
const start = performance.now();
for (let i = 0; i < 5000; i++) scoring.buildSideAssessment(stats(cleanMoves, 96, 8), phases(5, 5, 4));
assert.ok(performance.now() - start < 1500, 'assessment loop exceeded 1.5s');

console.log('Lite assessment: representative scenarios and performance passed.');
