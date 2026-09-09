/**
 * Offline sweep of Familiar classification knobs against Chess.com fixture.
 * Uses a Stockfish dump (winLoss/playedBest/gap) so sweeps are instant.
 *
 *   node chess/tests/calibrate-familiar.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dump = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures/familiar-analysis-dump.json'), 'utf8')
);
const fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'fixtures/familiar-chesscom-game.json'), 'utf8')
);

const LABELS = [
    'Brilliant', 'Great', 'Best', 'Excellent', 'Good', 'Book', 'Theory',
    'Inaccuracy', 'Mistake', 'Miss', 'Blunder'
];

function expectedCounts(colour) {
    const o = Object.fromEntries(LABELS.map((n) => [n, 0]));
    const row = fixture.expected.find((e) => e.colour === colour);
    for (const g of row?.groupingcount || []) o[g.name] = g.count || 0;
    o.Best += o.Brilliant;
    o.Brilliant = 0;
    return o;
}

function empty() {
    return Object.fromEntries(LABELS.map((n) => [n, 0]));
}

function classifyRow(row, params, prevOppLabel) {
    if (row.label === 'Book' || row.label === 'Theory' || row.isBook) {
        return row.label === 'Theory' ? 'Theory' : 'Book';
    }

    let ep = Math.max(0, Number(row.winLoss) || 0) * params.epScale;
    const { excellent, good, inaccuracy, mistake } = params.bands;

    let label;
    if (row.playedBest) label = 'Best';
    else if (ep <= excellent) {
        // Club Game Review often folds dead-equal non-top mates into Best/Good
        if (params.zeroEpAs === 'Best' && ep <= 0.001) label = 'Best';
        else if (params.zeroEpAs === 'Good' && ep <= 0.001) label = 'Good';
        else label = 'Excellent';
    } else if (ep <= good) label = 'Good';
    else if (ep <= inaccuracy) label = 'Inaccuracy';
    else if (ep <= mistake) label = 'Mistake';
    else label = 'Blunder';

    // Great — only-move in a still-contested position (not already decided)
    if (label === 'Best' && row.engineGapCp != null && row.engineGapCp >= params.greatGapCp) {
        const wb = row.winBefore;
        const okWin = wb == null
            || (wb >= params.greatMinWin && wb <= params.greatMaxWin);
        if (okWin) label = 'Great';
    }

    // Soft demote blunder (uses unscaled winLoss like analysis.js)
    const wl = Number(row.winLoss) || 0;
    if (params.softBlunders && label === 'Blunder') {
        const hang = row.materialEvent?.kind === 'hang';
        if (!hang && wl < params.softBlunderKeepEp) {
            label = params.softBlunderTo || 'Mistake';
        }
    }
    if (params.softMistakes && label === 'Mistake') {
        const hang = row.materialEvent?.kind === 'hang';
        if (!hang && wl < params.softMistakeKeepEp) label = 'Inaccuracy';
    }

    // Miss
    if (label !== 'Best' && label !== 'Excellent' && label !== 'Great' && label !== 'Book') {
        const matMiss = row.materialEvent?.kind === 'missed_capture'
            && ['Good', 'Inaccuracy', 'Mistake', 'Blunder'].includes(label);
        const oppBlunder = prevOppLabel === 'Blunder';
        const oppMistake = prevOppLabel === 'Mistake' && (row.winBefore || 0) >= params.missMistakeWinBefore;
        const early = (row.moveNum || 99) <= params.missMinMove;
        if (matMiss) label = 'Miss';
        else if (!early && (oppBlunder || oppMistake) && (row.winBefore || 0) >= params.missMinWinBefore) {
            if (['Mistake', 'Blunder'].includes(label)) label = 'Miss';
            else if (label === 'Inaccuracy' && (oppBlunder || wl >= params.missInaccEp)) label = 'Miss';
            else if (label === 'Good' && oppBlunder && wl >= params.missGoodEp) label = 'Miss';
        }
    }

    return label;
}

function scoreParams(params) {
    const white = empty();
    const black = empty();
    let prev = null;
    for (const row of dump.rows) {
        const label = classifyRow(row, params, prev);
        const bucket = row.turn === 'w' ? white : black;
        bucket[label] = (bucket[label] || 0) + 1;
        prev = label;
    }
    const expW = expectedCounts('white');
    const expB = expectedCounts('black');
    let l1 = 0;
    let mismatches = 0;
    for (const n of LABELS) {
        if (n === 'Brilliant' || n === 'Theory') continue;
        const dw = Math.abs((expW[n] || 0) - (white[n] || 0));
        const db = Math.abs((expB[n] || 0) - (black[n] || 0));
        if ((expW[n] || white[n]) && dw) mismatches++;
        if ((expB[n] || black[n]) && db) mismatches++;
        l1 += dw + db;
    }
    return { l1, mismatches, white, black };
}

const candidates = [];
const epScales = [0.75, 0.8, 0.85, 0.88, 0.92, 1.0];
const goodCaps = [0.05, 0.07, 0.085, 0.1, 0.12];
const inaccCaps = [0.1, 0.12, 0.14, 0.16, 0.18];
const mistCaps = [0.2, 0.22, 0.26, 0.3];
const softBKeep = [0.2, 0.24, 0.28, 0.32, 0.36];
const softMKeep = [0.12, 0.14, 0.16, 0.18, 0.2];
const softBTo = ['Mistake', 'Inaccuracy'];
const greatGaps = [200, 280, 350, 450, 550];
const greatMinWins = [0, 0.2, 0.35];
const greatMaxWins = [0.75, 0.85, 0.95, 1];
const missMinMoves = [0, 3, 5];
const zeroEpAsOpts = [null, 'Best', 'Good'];

let best = null;
let tried = 0;
for (const epScale of epScales) {
    for (const good of goodCaps) {
        for (const inaccuracy of inaccCaps) {
            if (inaccuracy <= good) continue;
            for (const mistake of mistCaps) {
                if (mistake <= inaccuracy) continue;
                for (const softBlunderKeepEp of softBKeep) {
                    for (const softMistakeKeepEp of softMKeep) {
                        for (const softBlunderTo of softBTo) {
                            for (const greatGapCp of greatGaps) {
                                for (const greatMinWin of greatMinWins) {
                                    for (const greatMaxWin of greatMaxWins) {
                                        if (greatMaxWin <= greatMinWin) continue;
                                        for (const missMinMove of missMinMoves) {
                                            for (const zeroEpAs of zeroEpAsOpts) {
                                                const params = {
                                                    epScale,
                                                    bands: { excellent: 0.02, good, inaccuracy, mistake },
                                                    softBlunders: true,
                                                    softBlunderKeepEp,
                                                    softBlunderTo,
                                                    softMistakes: true,
                                                    softMistakeKeepEp,
                                                    greatGapCp,
                                                    greatMinWin,
                                                    greatMaxWin,
                                                    missMinMove,
                                                    missMistakeWinBefore: 0.58,
                                                    missMinWinBefore: 0.52,
                                                    missInaccEp: 0.04,
                                                    missGoodEp: 0.03,
                                                    zeroEpAs
                                                };
                                                const s = scoreParams(params);
                                                tried++;
                                                if (!best || s.l1 < best.l1
                                                    || (s.l1 === best.l1 && s.mismatches < best.mismatches)) {
                                                    best = { ...s, params };
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

console.log(`Tried ${tried} combos`);
console.log(`Best L1=${best.l1} mismatches≈${best.mismatches}`);
console.log('params', JSON.stringify(best.params, null, 2));
console.log('white', best.white);
console.log('black', best.black);

const expW = expectedCounts('white');
const expB = expectedCounts('black');
console.log('\nWhite diffs:');
for (const n of LABELS) {
    if (!(expW[n] || best.white[n])) continue;
    console.log(`  ${n}: exp ${expW[n]} act ${best.white[n] || 0}`);
}
console.log('Black diffs:');
for (const n of LABELS) {
    if (!(expB[n] || best.black[n])) continue;
    console.log(`  ${n}: exp ${expB[n]} act ${best.black[n] || 0}`);
}
