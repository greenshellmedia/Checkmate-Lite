#!/usr/bin/env node
/**
 * Familiar preset vs Chess.com Game Review — group-count comparison.
 *
 * Usage:
 *   node chess/tests/run-familiar-compare.mjs
 *   node chess/tests/run-familiar-compare.mjs --fixture=chess/tests/fixtures/familiar-chesscom-game.json
 *
 * Exit code 0 = exact match on all shared labels (Brilliant/Great may be missing until implemented).
 * By default Brilliant/Great expected counts are folded into Best for scoring unless --strict-specials.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import { Worker } from 'worker_threads';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const require = createRequire(import.meta.url);
const { Chess } = require(path.join(ROOT, 'node_modules/chess.js'));

const args = process.argv.slice(2);
const strictSpecials = args.includes('--strict-specials');
const dumpMoves = args.includes('--dump');
const fixtureArg = args.find(a => a.startsWith('--fixture='));
const fixturePath = path.resolve(
    ROOT,
    fixtureArg ? fixtureArg.slice('--fixture='.length) : 'chess/tests/fixtures/familiar-chesscom-game.json'
);

const LABEL_ORDER = [
    'Brilliant', 'Great', 'Best', 'Excellent', 'Good', 'Book', 'Theory',
    'Inaccuracy', 'Mistake', 'Miss', 'Blunder'
];

function loadFixture(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function buildPgn(moves, result) {
    return [
        '[Event "Familiar vs Chess.com fixture"]',
        '[Site "Test"]',
        '[White "WhitePlayer"]',
        '[Black "BlackPlayer"]',
        '[Result "' + (result || "*") + '"]',
        '',
        moves.trim() + ' ' + (result || '').trim()
    ].join('\n');
}

function emptyCounts() {
    const o = {};
    for (const name of LABEL_ORDER) o[name] = 0;
    return o;
}

function countsFromExpected(groupingcount) {
    const o = emptyCounts();
    for (const row of groupingcount || []) {
        if (row?.name) o[row.name] = Number(row.count) || 0;
    }
    return o;
}

/** Fold Brilliant into Best (unimplemented). Great is compared directly when present. */
function foldSpecials(counts) {
    const o = { ...counts };
    o.Best = (o.Best || 0) + (o.Brilliant || 0);
    o.Brilliant = 0;
    return o;
}

function wrapWorker(worker) {
    const listeners = new Set();
    worker.on('message', (data) => {
        const ev = { data };
        for (const fn of listeners) fn(ev);
    });
    worker.on('error', (err) => {
        console.error('[stockfish worker]', err);
    });
    return {
        postMessage: (m) => worker.postMessage(m),
        addEventListener: (type, fn) => {
            if (type === 'message') listeners.add(fn);
        },
        removeEventListener: (type, fn) => {
            if (type === 'message') listeners.delete(fn);
        },
        terminate: () => worker.terminate()
    };
}

async function bootEngine(timeoutMs = 60000) {
    const workerPath = path.join(__dirname, 'stockfish-node-worker.mjs');
    const worker = new Worker(workerPath);
    const engine = wrapWorker(worker);

    await new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (!settled) {
                settled = true;
                reject(new Error('Stockfish UCI boot timeout'));
            }
        }, timeoutMs);

        const onMsg = (e) => {
            const msg = typeof e.data === 'string' ? e.data.trim() : '';
            if (msg === 'uciok' || /(^|\s)uciok(\s|$)/.test(msg)) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                engine.removeEventListener('message', onMsg);
                resolve();
            }
        };
        engine.addEventListener('message', onMsg);
        engine.postMessage('uci');
    });

    return engine;
}

function loadAppSandbox(engineReadyFlag) {
    const sandbox = {
        console,
        Chess,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        URL,
        Blob: class Blob {
            constructor() {}
        },
        fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
        Worker: class {
            constructor() { throw new Error('Use test engine'); }
        },
        document: {
            getElementById: () => null
        },
        window: {},
        navigator: { hardwareConcurrency: 4 },
        localStorage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            key: () => null,
            get length() { return 0; }
        },
        Math,
        JSON,
        Number,
        String,
        Array,
        Object,
        Map,
        Set,
        Promise,
        Error,
        parseInt,
        isNaN,
        Infinity
    };
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    sandbox.window = sandbox;

    const run = (rel) => {
        const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        vm.runInNewContext(code, sandbox, { filename: rel });
    };

    run('js/chess/constants.js');
    // `let userSettings` is closed over inside the VM — mutate via saveUserSettings, not sandbox.userSettings =
    if (typeof sandbox.saveUserSettings === 'function') {
        sandbox.saveUserSettings({ analysisPreset: 'familiar', analysisPresetChosen: true });
    }
    run('js/chess/tactics.js');
    run('js/chess/openings.js');
    run('js/chess/analysis.js');

    sandbox.enginesReady = true;
    if (sandbox.ChessApp) {
        sandbox.ChessApp.isScanning = true;
        sandbox.ChessApp.isDeepening = false;
        sandbox.ChessApp.enginesReady = true;
    }
    sandbox.isScanning = true;
    sandbox.isDeepening = false;
    sandbox.enginesReady = true;
    sandbox.engines = [];
    sandbox.log = () => {};

    const preset = typeof sandbox.getActiveAnalysisPreset === 'function'
        ? sandbox.getActiveAnalysisPreset()
        : null;
    if (!preset || preset.id !== 'familiar') {
        throw new Error(`Failed to lock Familiar preset (got ${preset?.id || 'none'})`);
    }

    // Opening book: try load openings.json for realistic Book tags
    try {
        const book = JSON.parse(fs.readFileSync(path.join(ROOT, 'openings.json'), 'utf8'));
        if (typeof sandbox.setOpeningBook === 'function') sandbox.setOpeningBook(book);
        else if (Array.isArray(book)) {
            sandbox.ACTIVE_OPENING_BOOK = book;
            sandbox.ChessApp.openingBook = book;
        }
    } catch (_) {
        /* internal book only */
    }
    try {
        const fam = JSON.parse(fs.readFileSync(path.join(ROOT, 'famous-games.json'), 'utf8'));
        if (typeof sandbox.setFamousGames === 'function') sandbox.setFamousGames(fam);
    } catch (_) {}

    return sandbox;
}

function tallyByColour(analysis) {
    const white = emptyCounts();
    const black = emptyCounts();
    for (const m of analysis.moves || []) {
        const label = m.classification?.label;
        if (!label) continue;
        const bucket = m.turn === 'w' ? white : black;
        if (bucket[label] == null) bucket[label] = 0;
        bucket[label] += 1;
    }
    return { white, black };
}

function diffCounts(expected, actual, colour) {
    const rows = [];
    let mismatches = 0;
    for (const name of LABEL_ORDER) {
        const exp = expected[name] || 0;
        const act = actual[name] || 0;
        const ok = exp === act;
        if (!ok) mismatches += 1;
        if (exp || act) {
            rows.push({ colour, name, expected: exp, actual: act, ok });
        }
    }
    return { mismatches, rows };
}

function printTable(title, rows) {
    console.log('\n' + title);
    console.log('Label'.padEnd(14) + 'Expected'.padStart(10) + 'Actual'.padStart(10) + '  Status');
    console.log('-'.repeat(44));
    for (const r of rows) {
        const mark = r.ok ? 'OK' : 'DIFF';
        console.log(
            r.name.padEnd(14) +
            String(r.expected).padStart(10) +
            String(r.actual).padStart(10) +
            '  ' + mark
        );
    }
}

async function main() {
    const fixture = loadFixture(fixturePath);
    console.log(`Fixture: ${fixture.id}`);
    console.log(`Preset:  ${fixture.preset || 'familiar'}`);
    console.log(`Strict Brilliant/Great: ${strictSpecials}`);

    console.log('Booting Stockfish…');
    const rawEngine = await bootEngine();
    const sandbox = loadAppSandbox();
    const engine = rawEngine;

    const pgn = buildPgn(fixture.moves, fixture.result);
    const game = {
        pgn,
        white: { username: 'WhitePlayer', result: 'checkmated' },
        black: { username: 'BlackPlayer', result: 'win' }
    };

    console.log(`Analysing ${fixture.moves.split(/\s+/).filter(t => /^\d+\./.test(t)).length * 2} plies at Familiar…`);
    const t0 = Date.now();
    // Analyze as White so isWhite path works; both sides still classified
    const analysis = await sandbox.analyzeGame(game, 'WhitePlayer', engine, (curr, total) => {
        if (curr === 1 || curr === total || curr % 10 === 0) {
            process.stdout.write(`\r  moves ${curr}/${total}`);
        }
    }, { depth: sandbox.getScanEngineDepth() });
    process.stdout.write('\n');
    const ms = Date.now() - t0;

    if (!analysis) {
        console.error('analyzeGame returned null (isScanning false?)');
        process.exit(2);
    }

    console.log(`Done in ${(ms / 1000).toFixed(1)}s · depth ${sandbox.getScanEngineDepth()} · noise ${sandbox.getEvalNoiseFloorCp()}cp`);

    const tallies = tallyByColour(analysis);
    const expWhite = countsFromExpected(fixture.expected.find(e => e.colour === 'white')?.groupingcount);
    const expBlack = countsFromExpected(fixture.expected.find(e => e.colour === 'black')?.groupingcount);

    const cmpWhiteExp = strictSpecials ? expWhite : foldSpecials(expWhite);
    const cmpBlackExp = strictSpecials ? expBlack : foldSpecials(expBlack);
    const cmpWhiteAct = strictSpecials ? tallies.white : foldSpecials(tallies.white);
    const cmpBlackAct = strictSpecials ? tallies.black : foldSpecials(tallies.black);

    const dW = diffCounts(cmpWhiteExp, cmpWhiteAct, 'white');
    const dB = diffCounts(cmpBlackExp, cmpBlackAct, 'black');
    printTable('White', dW.rows);
    printTable('Black', dB.rows);

    const unsupported = [];
    if ((expWhite.Brilliant || expBlack.Brilliant) && !strictSpecials) {
        unsupported.push('Note: Brilliant expected counts were folded into Best (not implemented). Pass --strict-specials to require them.');
    }
    for (const line of unsupported) console.log('\n' + line);

    // Raw actual dump (including Theory if any)
    console.log('\nRaw actual counts:');
    console.log('white', JSON.stringify(tallies.white));
    console.log('black', JSON.stringify(tallies.black));

    if (dumpMoves) {
        console.log('\nPer-move dump:');
        for (const m of analysis.moves || []) {
            const gap = m.engineGapCp != null ? ` gap=${Math.round(m.engineGapCp)}` : '';
            const wl = m.winLoss != null ? ` ep=${m.winLoss.toFixed(3)}` : '';
            const mat = m.materialEvent?.kind ? ` mat=${m.materialEvent.kind}` : '';
            console.log(
                `${String(m.moveNum).padStart(2)}${m.turn === 'w' ? '.' : '...'} ${String(m.san).padEnd(8)} ` +
                `${String(m.classification?.label || '').padEnd(12)}${wl}${gap}${mat}`
            );
        }
    }

    const failed = dW.mismatches + dB.mismatches;
    const l1 = [...dW.rows, ...dB.rows].reduce((s, r) => s + Math.abs(r.expected - r.actual), 0);
    console.log(`\nL1 distance (sum |exp-act|): ${l1}`);

    try { engine.terminate(); } catch (_) {}

    if (failed) {
        console.error(`\nFAILED — ${failed} label mismatch(es).`);
        process.exit(1);
    }
    console.log('\nPASSED — groupings match Chess.com fixture' + (strictSpecials ? '' : ' (Brilliant folded into Best)') + '.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(2);
});
