# Familiar vs Chess.com tests

## Fixture

[`fixtures/familiar-chesscom-game.json`](fixtures/familiar-chesscom-game.json) — PGN + Chess.com Game Review group counts (both colours).

## Run
 
From the repo root (requires Node + `chess.js` from `npm install`):

```bash
npm run test:familiar
```

Strict mode (also requires Brilliant / Great labels to match — currently unimplemented):

```bash
npm run test:familiar:strict
```

By default Brilliant/Great expected counts are **folded into Best** so the test measures the labels we actually emit.

## What it does

1. Boots local `stockfish.js` in a Node worker  
2. Loads the real app scripts (`constants`, `tactics`, `openings`, `analysis`) in a VM  
3. Forces the **Familiar** preset  
4. Analyses the fixture PGN and diffs per-colour group counts vs Chess.com  

Exit code `0` = pass, `1` = count mismatch, `2` = runner error.
