/**
 * Build famous-games.json from curated classics + selected WCC / model games.
 *
 *   npm install chess.js@0.10.3 --no-save --prefix ./_tmp_chess
 *   node _build_famous_games.js
 */
const fs = require('fs');
const https = require('https');
const { Chess } = require('./_tmp_chess/node_modules/chess.js');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function cleanSan(san) {
  return String(san || '').replace(/[+#?!]/g, '').replace(/^=.*/, '');
}

function movesFromPgn(pgn) {
  const chess = new Chess();
  const ok = chess.load_pgn(pgn, { sloppy: true });
  if (!ok) throw new Error('Invalid PGN');
  return chess.history();
}

function parseMultiPgn(text) {
  const games = [];
  const chunks = text.split(/\n\s*\n(?=\[Event)/);
  for (const chunk of chunks) {
    if (!chunk.includes('[Event')) continue;
    const chess = new Chess();
    if (!chess.load_pgn(chunk, { sloppy: true })) continue;
    const h = chess.header();
    const moves = chess.history();
    if (moves.length < 12) continue;
    games.push({
      event: h.Event || '',
      site: h.Site || '',
      date: h.Date || '',
      round: h.Round || '',
      white: h.White || '',
      black: h.Black || '',
      result: h.Result || '',
      eco: h.ECO || '',
      moves
    });
  }
  return games;
}

function yearOf(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})/);
  return m ? Number(m[1]) : null;
}

function entry({ name, year, white, black, theme, moves, eco, result }) {
  return {
    name,
    year: year || null,
    white: white || '',
    black: black || '',
    theme: theme || '',
    eco: eco || '',
    result: result || '',
    moves: moves.map(m => cleanSan(m))
  };
}

// --- Hardcoded classics (our original 6 + other well-known study games) ---
const CLASSICS = [
  {
    name: 'Opera Game',
    year: 1858,
    white: 'Paul Morphy',
    black: 'Duke of Brunswick / Count Isouard',
    theme: 'Rapid development, open lines, coordinating pieces for mate',
    moves: ["e4","e5","Nf3","d6","d4","Bg4","dxe5","Bxf3","Qxf3","dxe5","Bc4","Nf6","Qb3","Qe7","Nc3","c6","Bg5","b5","Nxb5","cxb5","Bxb5","Nbd7","O-O-O","Rd8","Rxd7","Rxd7","Rd1","Qe6","Bxd7","Nxd7","Qb8+","Nxb8","Rd8#"]
  },
  {
    name: 'Game of the Century',
    year: 1956,
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    theme: 'Queen sacrifice, piece activity, relentless king hunt',
    moves: ["Nf3","Nf6","c4","g6","Nc3","Bg7","d4","O-O","Bf4","d5","Qb3","dxc4","Qxc4","c6","e4","Nbd7","Rd1","Nb6","Qc5","Bg4","Bg5","Na4","Qa3","Nxc3","bxc3","Nxe4","Bxe7","Qb6","Bc4","Nxc3","Bc5","Rfe8+","Kf1","Be6","Bxb6","Bxc4+","Kg1","Ne2+","Kf1","Nxd4+","Kg1","Ne2+","Kf1","Nc3+","Kg1","axb6","Qb4","Ra4","Qxb6","Nxd1","h3","Rxa2","Kh2","Nxf2","Re1","Rxe1","Qd8+","Bf8","Nxe1","Bd5","Nf3","Ne4","Qb8","b5","h4","h5","Ne5","Kg7","Kg1","Bc5+","Kf1","Ng3+","Ke1","Bb4+","Kd1","Bb3+","Kc1","Ne2+","Kb1","Nc3+","Kc1","Rc2#"]
  },
  {
    name: 'Immortal Game',
    year: 1851,
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    theme: 'Romantic king attack; sacrificing heavily for mate',
    moves: ["e4","e5","f4","exf4","Bc4","Qh4+","Kf1","b5","Bxb5","Nf6","Nf3","Qh6","d3","Nh5","Nh4","Qg5","Nf5","c6","g4","Nf6","Rg1","cxb5","h4","Qg6","h5","Qg5","Qf3","Ng8","Bxf4","Qf6","Nc3","Bc5","Nd5","Qxb2","Bd6","Bxg1","e5","Qxa1+","Ke2","Na6","Nxg7+","Kd8","Qf6+","Nxf6","Be7#"]
  },
  {
    name: 'Evergreen Game',
    year: 1852,
    white: 'Adolf Anderssen',
    black: 'Jean Dufresne',
    theme: 'Evans Gambit; classic mating combination',
    moves: ["e4","e5","Nf3","Nc6","Bc4","Bc5","b4","Bxb4","c3","Ba5","d4","exd4","O-O","d3","Qb3","Qf6","e5","Qg6","Re1","Nge7","Ba3","b5","Qxb5","Rb8","Qa4","Bb6","Nbd2","Bb7","Ne4","Qf5","Bxd3","Qh5","Nf6+","gxf6","exf6","Rg8","Rad1","Qxf3","Rxe7+","Nxe7","Qxd7+","Kxd7","Bf5+","Ke8","Bd7+","Kf8","Bxe7#"]
  },
  {
    name: "Kasparov's Immortal (vs Topalov 1999)",
    year: 1999,
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    theme: 'Deep rook sacrifice and long king hunt',
    moves: ["e4","d6","d4","Nf6","Nc3","g6","Be3","Bg7","Qd2","c6","f3","b5","Nge2","Nbd7","Bh6","Bxh6","Qxh6","Bb7","a3","e5","O-O-O","Qe7","Kb1","a6","Nc1","O-O-O","Nb3","exd4","Rxd4","c5","Rd1","Nb6","g3","Kb8","Na5","Ba8","Bh3","d5","Qf4+","Ka7","Rhe1","d4","Nd5","Nbxd5","exd5","Qd6","Rxd4","cxd4","Re7+","Kb6","Qxd4+","Kxa5","b4+","Ka4","Qc3","Qxd5","Ra7","Bb7","Rxb7","Qc4","Qxf6","Kxa3","Qxa6+","Kxb4","c3+","Kxc3","Qa1+","Kd2","Qb2+","Kd1","Bf1","Rd2","Rd7","Rxd7","Bxc4","bxc4","Qxh8","Rd3","Qa8","c3","Qa4+","Ke1","f4","f5","Kc1","Rd2","Qa7"]
  },
  // Additional study classics (PGN-validated below)
];

const CLASSIC_PGNS = [
  {
    name: 'Lasker vs Bauer 1889 (double bishop sacrifice)',
    year: 1889,
    white: 'Emanuel Lasker',
    black: 'Johann Bauer',
    theme: 'Model double-bishop sacrifice on h7/g7',
    pgn: `1.f4 d5 2.e3 Nf6 3.b3 e6 4.Bb2 Be7 5.Bd3 b6 6.Nf3 Bb7 7.Nc3 Nbd7 8.O-O O-O
9.Ne2 c5 10.Ng3 Qc7 11.Ne5 Nxe5 12.Bxe5 Qc6 13.Qe2 a6 14.Nh5 Nxh5 15.Bxh7+ Kxh7
16.Qxh5+ Kg8 17.Bxg7 Kxg7 18.Qg4+ Kh7 19.Rf3 e5 20.Rh3+ Qh6 21.Rxh6+ Kxh6
22.Qd7 Bf6 23.Qxb7 Kg7 24.Rf1 Rab8 25.Qd7 Rfd8 26.Qg4+ Kf8 27.fxe5 Bg7 28.e6 Rb7
29.Qg6 f6 30.Rxf6+ Bxf6 31.Qxf6+ Ke8 32.Qh8+ Ke7 33.Qg7+ Kxe6 34.Qxb7 Rd6 35.Qxa6 d4
36.exd4 cxd4 37.Qd3 Kf6 38.h4 Ke5 39.Qh3 Rf6 40.Qd3 Kd6 41.Qxd4+ 1-0`
  },
  {
    name: "Rubinstein's Immortal (Rotlewi vs Rubinstein 1907)",
    year: 1907,
    white: 'Georg Rotlewi',
    black: 'Akiba Rubinstein',
    theme: 'Bishop pair and open diagonals; sacrificial mating attack',
    pgn: `1.d4 d5 2.Nf3 e6 3.e3 c5 4.c4 Nc6 5.Nc3 Nf6 6.dxc5 Bxc5 7.a3 a6 8.b4 Bd6
9.Bb2 O-O 10.Qd2 Qe7 11.Bd3 dxc4 12.Bxc4 b5 13.Bd3 Rd8 14.Qe2 Bb7 15.O-O Ne5
16.Nxe5 Bxe5 17.f4 Bc7 18.e4 Rac8 19.e5 Bb6+ 20.Kh1 Ng4 21.Be4 Qh4 22.g3 Rxc3
23.gxh4 Rd2 24.Qxd2 Bxe4+ 25.Qg2 Rh3 0-1`
  },
  {
    name: 'Steinitz vs von Bardeleben 1895',
    year: 1895,
    white: 'Wilhelm Steinitz',
    black: 'Curt von Bardeleben',
    theme: 'Classical centre play culminating in a famous king hunt',
    pgn: `1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.c3 Nf6 5.d4 exd4 6.cxd4 Bb4+ 7.Nc3 d5 8.exd5 Nxd5
9.O-O Be6 10.Bg5 Be7 11.Bxd5 Bxd5 12.Nxd5 Qxd5 13.Bxe7 Nxe7 14.Re1 f6 15.Qe2 Qd7
16.Rac1 c6 17.d5 cxd5 18.Nd4 Kf7 19.Ne6 Rhc8 20.Qg4 g6 21.Ng5+ Ke8 22.Rxe7+ Kf8
23.Rf7+ Kg8 24.Rg7+ Kh8 25.Rxh7+ 1-0`
  },
  {
    name: 'Marshall Attack debut (Capablanca vs Marshall 1918)',
    year: 1918,
    white: 'Jose Raul Capablanca',
    black: 'Frank Marshall',
    theme: 'Defending the Marshall Gambit; model Ruy Lopez defence',
    pgn: `1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5
9.exd5 Nxd5 10.Nxe5 Nxe5 11.Rxe5 Nf6 12.Re1 Bd6 13.h3 Ng4 14.Qf3 Qh4 15.d4 Nxf2
16.Re2 Bg4 17.hxg4 Bh2+ 18.Kf1 Bg3 19.Rxf2 Qh1+ 20.Ke2 Bxf2 21.Bd2 Bh4 22.Qh3 Rae8+
23.Kd3 Qf1+ 24.Kc2 Bf2 25.Qf3 Qg1 26.Bd5 c5 27.dxc5 Bxc5 28.b4 Bd6 29.a4 a5
30.axb5 axb4 31.Ra6 bxc3 32.Nxc3 Bb4 33.b6 Bxc3 34.Bxc3 h6 35.b7 Re3 36.Bxf7+ 1-0`
  },
  {
    name: 'Botvinnik vs Capablanca 1938 AVRO',
    year: 1938,
    white: 'Mikhail Botvinnik',
    black: 'Jose Raul Capablanca',
    theme: 'Central breakthrough and knight sacrifice; Botvinnik model attack',
    pgn: `1.d4 Nf6 2.c4 e6 3.Nc3 Bb4 4.e3 d5 5.a3 Bxc3+ 6.bxc3 c5 7.cxd5 exd5 8.Bd3 O-O
9.Ne2 b6 10.O-O Ba6 11.Bxa6 Nxa6 12.Bb2 Qd7 13.a4 Rfe8 14.Qd3 c4 15.Qc2 Nb8
16.Rae1 Nc6 17.Ng3 Na5 18.f3 Nb3 19.e4 Qxa4 20.e5 Nd7 21.Qf2 g6 22.f4 f5 23.exf6 Nxf6
24.f5 Rxe1 25.Rxe1 Re8 26.Re6 Rxe6 27.fxe6 Kg7 28.Qf4 Qe8 29.Qe5 Qe7 30.Ba3 Qxa3
31.Nh5+ gxh5 32.Qg5+ Kf8 33.Qxf6+ Kg8 34.e7 Qc1+ 35.Kf2 Qc2+ 36.Kg3 Qd3+ 37.Kh4 Qe4+
38.Kxh5 Qe2+ 39.Kh4 Qe4+ 40.g4 Qe1+ 41.Kh5 1-0`
  }
];

// Validate every PGN / WCC extract and drop failures.

const WCC_SELECTIONS = [
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp1921.pgn',
    picks: [
      { round: '5', name: 'Lasker vs Capablanca 1921 Game 5', theme: 'World Championship positional technique; Capablanca’s clarity' },
      { round: '10', name: 'Capablanca vs Lasker 1921 Game 10', theme: 'Capablanca endgame technique in the title match' },
      { round: '11', name: 'Lasker vs Capablanca 1921 Game 11', theme: 'Endgame conversion in a title match' },
      { round: '14', name: 'Capablanca vs Lasker 1921 Game 14', theme: 'Match-clinching positional win' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp1927.pgn',
    picks: [
      { round: '1', name: 'Capablanca vs Alekhine 1927 Game 1', theme: 'Opening of the Buenos Aires WC match' },
      { round: '11', name: 'Capablanca vs Alekhine 1927 Game 11', theme: 'Queens Gambit structures from the Buenos Aires match' },
      { round: '21', name: 'Alekhine vs Capablanca 1927 Game 21', theme: 'Alekhine dynamic style against Capablanca' },
      { round: '32', name: 'Capablanca vs Alekhine 1927 Game 32', theme: 'Late-match technical struggle' },
      { round: '34', name: 'Alekhine vs Capablanca 1927 Game 34', theme: 'Title-clinching technical win; queenside majority model' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp1935.pgn',
    picks: [
      { round: '2', name: 'Alekhine vs Euwe 1935 Game 2', theme: 'Dutch / classical structures in a WC match' },
      { round: '9', name: 'Euwe vs Alekhine 1935 Game 9', theme: 'Euwe’s methodical style dethroning Alekhine' },
      { round: '25', name: 'Euwe vs Alekhine 1935 Game 25', theme: 'Critical late-match game from Euwe’s title win' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp1960.pgn',
    picks: [
      { round: '1', name: 'Botvinnik vs Tal 1960 Game 1', theme: 'Tal’s attacking debut as challenger' },
      { round: '6', name: 'Tal vs Botvinnik 1960 Game 6', theme: 'Tal attacking style in a world championship setting' },
      { round: '17', name: 'Tal vs Botvinnik 1960 Game 17', theme: 'Tal creativity under match pressure' },
      { round: '19', name: 'Tal vs Botvinnik 1960 Game 19', theme: 'Title-clinching brilliance from Tal' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp1972.pgn',
    picks: [
      { round: '1', name: 'Spassky vs Fischer 1972 Game 1', theme: 'Poisoned pawn / bishop capture controversy opener' },
      { round: '3', name: 'Spassky vs Fischer 1972 Game 3', theme: 'Benoni structures; Fischer’s first win in the match' },
      { round: '5', name: 'Spassky vs Fischer 1972 Game 5', theme: 'Nimzo-Indian structures; Fischer match momentum' },
      { round: '6', name: 'Fischer vs Spassky 1972 Game 6', theme: 'Tartakower/Orthodox QGD model; positional squeeze and attack' },
      { round: '8', name: 'Fischer vs Spassky 1972 Game 8', theme: 'English Opening model from the Match of the Century' },
      { round: '10', name: 'Fischer vs Spassky 1972 Game 10', theme: 'Ruy Lopez Breyer; classical world-championship technique' },
      { round: '13', name: 'Spassky vs Fischer 1972 Game 13', theme: 'Alekhine Defence complexity; famous a-pawn endgame race' },
      { round: '21', name: 'Spassky vs Fischer 1972 Game 21', theme: 'Match-clinching final game' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp1987.pgn',
    picks: [
      { round: '4', name: 'Karpov vs Kasparov 1987 Game 4', theme: 'Karpov–Kasparov positional battle in Seville' },
      { round: '11', name: 'Kasparov vs Karpov 1987 Game 11', theme: 'Dynamic imbalance from the Seville rematch' },
      { round: '16', name: 'Kasparov vs Karpov 1987 Game 16', theme: 'Kasparov–Karpov dynamic imbalance in a WC rematch' },
      { round: '24', name: 'Kasparov vs Karpov 1987 Game 24', theme: 'Title-saving game; practical defence under extreme pressure' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp2000.pgn',
    picks: [
      { round: '1', name: 'Kasparov vs Kramnik 2000 Game 1', theme: 'Opening of the London match; Berlin era begins' },
      { round: '2', name: 'Kasparov vs Kramnik 2000 Game 2', theme: 'Berlin Wall defence model that reshaped 1.e4 theory' },
      { round: '3', name: 'Kramnik vs Kasparov 2000 Game 3', theme: 'Berlin / Catalan structures in modern WC practice' },
      { round: '10', name: 'Kramnik vs Kasparov 2000 Game 10', theme: 'Kramnik title-clinching technique' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp2013.pgn',
    picks: [
      { round: '3', name: 'Anand vs Carlsen 2013 Game 3', theme: 'Early Chennai match tension' },
      { round: '5', name: 'Anand vs Carlsen 2013 Game 5', theme: 'Modern WC positional grind; Carlsen conversion style' },
      { round: '6', name: 'Carlsen vs Anand 2013 Game 6', theme: 'Carlsen endgame technique securing the title match' },
      { round: '9', name: 'Anand vs Carlsen 2013 Game 9', theme: 'Sharp WC struggle; modern opening preparation' },
      { round: '10', name: 'Carlsen vs Anand 2013 Game 10', theme: 'Match-clinching game crowning Carlsen' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp2016.pgn',
    picks: [
      { round: '3', name: 'Karjakin vs Carlsen 2016 Game 3', theme: 'Early New York match struggle' },
      { round: '8', name: 'Carlsen vs Karjakin 2016 Game 8', theme: 'Karjakin’s famous win vs Carlsen in the WC' },
      { round: '10', name: 'Carlsen vs Karjakin 2016 Game 10', theme: 'Carlsen classical grind to break a WC deadlock' }
    ]
  },
  {
    url: 'https://raw.githubusercontent.com/fsmosca/ThinkerJudge/main/docs/pgn/WorldChamp2018.pgn',
    picks: [
      { round: '1', name: 'Carlsen vs Caruana 2018 Game 1', theme: 'Modern elite preparation; Sicilian Rossolimo structures' },
      { round: '6', name: 'Caruana vs Carlsen 2018 Game 6', theme: 'Petroff structures from the London WC' },
      { round: '8', name: 'Caruana vs Carlsen 2018 Game 8', theme: 'Sveshnikov Sicilian model from a WC match' },
      { round: '12', name: 'Caruana vs Carlsen 2018 Game 12', theme: 'Classical finale before the rapid tiebreaks' }
    ]
  }
];

const EXTRA_URLS = [
  {
    url: 'https://raw.githubusercontent.com/niklasf/python-chess/master/data/pgn/kasparov-deep-blue-1997.pgn',
    picks: [
      { site: '01', name: 'Kasparov vs Deep Blue 1997 Game 1', theme: 'Human vs machine; instructive opening / middlegame plans' },
      { site: '02', name: 'Deep Blue vs Kasparov 1997 Game 2', theme: 'Machine positional grind; historic human–computer match' },
      { site: '06', name: 'Deep Blue vs Kasparov 1997 Game 6', theme: 'Historic machine win; Caro-Kann disaster study' }
    ]
  }
];

const TARGET_COUNT = 90;

function shortName(white, black) {
  const last = (s) => String(s || '').split(',')[0].trim() || 'Unknown';
  return `${last(white)} vs ${last(black)}`;
}

function stringifyFamousGames(games) {
  // Pretty object fields, but keep each moves array on one line
  const blocks = games.map(g => {
    const lines = [
      `    "name": ${JSON.stringify(g.name)},`,
      `    "year": ${g.year === null ? 'null' : g.year},`,
      `    "white": ${JSON.stringify(g.white)},`,
      `    "black": ${JSON.stringify(g.black)},`,
      `    "theme": ${JSON.stringify(g.theme)},`,
      `    "eco": ${JSON.stringify(g.eco)},`,
      `    "result": ${JSON.stringify(g.result)},`,
      `    "moves": ${JSON.stringify(g.moves)}`
    ];
    return `  {\n${lines.join('\n')}\n  }`;
  });
  return `[\n${blocks.join(',\n')}\n]\n`;
}

async function main() {
  const out = [];
  const seen = new Set();
  const fetchedPools = []; // { games, label } for fill-up

  function add(e) {
    const chess = new Chess();
    for (const mv of e.moves) {
      if (!chess.move(mv, { sloppy: true })) {
        console.warn('SKIP invalid moves:', e.name, 'at', mv);
        return false;
      }
    }
    if (e.moves.length < 12) {
      console.warn('SKIP too short:', e.name);
      return false;
    }
    const key = e.moves.slice(0, 20).join(' ');
    if (seen.has(key)) {
      console.warn('SKIP duplicate line:', e.name);
      return false;
    }
    seen.add(key);
    out.push(e);
    console.log('OK', e.name, `(${e.moves.length} plies)`);
    return true;
  }

  for (const g of CLASSICS) add(entry(g));

  for (const g of CLASSIC_PGNS) {
    try {
      const moves = movesFromPgn(g.pgn);
      add(entry({ ...g, moves }));
    } catch (e) {
      console.warn('SKIP classic PGN', g.name, e.message);
    }
  }

  for (const block of [...WCC_SELECTIONS, ...EXTRA_URLS]) {
    try {
      console.log('Fetching', block.url);
      const text = await fetchText(block.url);
      const games = parseMultiPgn(text);
      fetchedPools.push({ games, url: block.url });
      for (const pick of block.picks) {
        const match = games.find(g => {
          if (pick.round && String(g.round) === String(pick.round)) return true;
          if (pick.site && String(g.site) === String(pick.site)) return true;
          return false;
        });
        if (!match) {
          console.warn('Missing pick', pick.name, 'from', block.url);
          continue;
        }
        add(entry({
          name: pick.name,
          year: yearOf(match.date),
          white: match.white,
          black: match.black,
          theme: pick.theme,
          eco: match.eco,
          result: match.result,
          moves: match.moves
        }));
      }
    } catch (e) {
      console.warn('Fetch failed', block.url, e.message);
    }
  }

  // Fill to TARGET_COUNT with additional decisive WC / model games
  if (out.length < TARGET_COUNT) {
    console.log(`\nFilling to ${TARGET_COUNT} (have ${out.length})...`);
    const candidates = [];
    for (const pool of fetchedPools) {
      for (const g of pool.games) {
        if (!['1-0', '0-1'].includes(g.result)) continue;
        if (g.moves.length < 20) continue;
        candidates.push(g);
      }
    }
    // Prefer longer instructive decisive games
    candidates.sort((a, b) => b.moves.length - a.moves.length);

    for (const g of candidates) {
      if (out.length >= TARGET_COUNT) break;
      const year = yearOf(g.date);
      const roundBit = g.round ? ` Game ${g.round}` : (g.site ? ` (${g.site})` : '');
      const name = `${shortName(g.white, g.black)}${year ? ` ${year}` : ''}${roundBit}`;
      add(entry({
        name,
        year,
        white: g.white,
        black: g.black,
        theme: 'World Championship / elite model game (decisive)',
        eco: g.eco,
        result: g.result,
        moves: g.moves
      }));
    }
  }

  out.sort((a, b) => (a.year || 9999) - (b.year || 9999) || a.name.localeCompare(b.name));

  const path = 'd:/Coding/Website/Checkmate-Lite/famous-games.json';
  fs.writeFileSync(path, stringifyFamousGames(out));
  console.log(`\nWrote ${out.length} games -> famous-games.json`);
  if (out.length < TARGET_COUNT) {
    console.warn(`WARNING: only ${out.length} games (target ${TARGET_COUNT})`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
