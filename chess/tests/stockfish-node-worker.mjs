/**
 * Node worker entry: run stockfish.js with web-worker-like message plumbing.
 * Usage: new Worker(new URL('./stockfish-node-worker.mjs', import.meta.url))
 */
import { parentPort } from 'worker_threads';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// stockfish.js expects classic worker globals
const self = globalThis;
self.postMessage = (msg) => parentPort.postMessage(msg);
parentPort.on('message', (data) => {
    if (typeof self.onmessage === 'function') {
        self.onmessage({ data });
    }
});

require(path.join(root, 'stockfish.js'));
