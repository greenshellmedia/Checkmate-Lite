/**
 * One-shot: run Familiar Stockfish analysis and write move rows for offline calibration.
 *   node chess/tests/dump-familiar-analysis.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import { pathToFileURL as _ } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// Import runner pieces by re-executing compare after patching — simpler: spawn compare isn't enough.
// Inline boot via dynamic import of the compare module's flow by duplicating minimal call.
const compareUrl = pathToFileURL(path.join(__dirname, 'run-familiar-compare.mjs')).href;

// Instead: monkey-patch process.argv and capture by writing from a tiny fork of main.
// Easiest path: copy boot from compare via child that prints JSON — use analyze in-process.

import vm from 'vm';
import { Worker } from 'worker_threads';
const require = createRequire(import.meta.url);
const { Chess } = require(path.join(ROOT, 'node_modules/chess.js'));

const fixture = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'chess/tests/fixtures/familiar-chesscom-game.json'), 'utf8')
);

function wrapWorker(worker) {
    const listeners = new Set();
    worker.on('message', (data) => {
        const ev = { data };
        for (const fn of listeners) fn(ev);
    });
    return {
        postMessage: (m) => worker.postMessage(m),
        addEventListener: (type, fn) => { if (type === 'message') listeners.add(fn); },
        removeEventListener: (type, fn) => { if (type === 'message') listeners.delete(fn); },
        terminate: () => worker.terminate()
    };
}

async function bootEngine() {
    const worker = new Worker(path.join(__dirname, 'stockfish-node-worker.mjs'));
    const engine = wrapWorker(worker);
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('boot timeout')), 60000);
        const onMsg = (e) => {
            const msg = typeof e.data === 'string' ? e.data.trim() : '';
            if (msg === 'uciok' || /(^|\s)uciok(\s|$)/.test(msg)) {
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

function loadAppSandbox() {
    const sandbox = {
        console, Chess, setTimeout, clearTimeout, setInterval, clearInterval, URL,
        Blob: class Blob { constructor() {} },
        fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
        Worker: class { constructor() { throw new Error('Use test engine'); } },
        document: { getElementById: () => null },
        window: {}, navigator: { hardwareConcurrency: 4 },
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, key: () => null, get length() { return 0; } },
        Math, JSON, Number, String, Array, Object, Map, Set, Promise, Error, parseInt, isNaN, Infinity
    };
    sandbox.globalThis = sandbox;
    sandbox.self = sandbox;
    sandbox.window = sandbox;
    const run = (rel) => {
        vm.runInNewContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
    };
    run('js/chess/constants.js');
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
    try {
        const book = JSON.parse(fs.readFileSync(path.join(ROOT, 'openings.json'), 'utf8'));
        if (typeof sandbox.setOpeningBook === 'function') sandbox.setOpeningBook(book);
        else {
            sandbox.ACTIVE_OPENING_BOOK = book;
            sandbox.ChessApp.openingBook = book;
        }
    } catch (_) {}
    return sandbox;
}

const engine = await bootEngine();
const sandbox = loadAppSandbox();
const pgn = [
    '[Event "dump"]', '[Result "' + fixture.result + '"]', '',
    fixture.moves.trim() + ' ' + fixture.result
].join('\n');
const game = {
    pgn,
    white: { username: 'WhitePlayer', result: 'checkmated' },
    black: { username: 'BlackPlayer', result: 'win' }
};
const analysis = await sandbox.analyzeGame(game, 'WhitePlayer', engine, () => {}, {
    depth: sandbox.getScanEngineDepth()
});
const rows = (analysis.moves || []).map((m) => ({
    moveNum: m.moveNum,
    turn: m.turn,
    san: m.san,
    label: m.classification?.label,
    winLoss: m.winLoss,
    winBefore: m.winBefore,
    evalDeltaCp: m.evalDeltaCp,
    engineGapCp: m.engineGapCp,
    playedBest: m.playedBest,
    bestEngineMove: m.bestEngineMove,
    altEngineMoves: m.altEngineMoves || [],
    materialEvent: m.materialEvent,
    isBook: m.classification?.label === 'Book' || m.classification?.label === 'Theory'
}));
const out = path.join(__dirname, 'fixtures/familiar-analysis-dump.json');
fs.writeFileSync(out, JSON.stringify({ fixture: fixture.id, rows }, null, 2));
console.log('Wrote', out, 'moves', rows.length);
try { engine.terminate(); } catch (_) {}
