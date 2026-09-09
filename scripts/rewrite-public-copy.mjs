import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.vs') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const common = new Map([
  ['Turn your games into a practical next step.', 'See what your games have been telling you.'],
  ['Bring in your games, understand the recurring patterns, and explore the CheckmateMore Pro beta.', 'Review a game in Lite, or open CheckmateMore to build a clearer picture over time.'],
  ['Try Pro beta', 'Open CheckmateMore'],
  ['Explore featured players', 'View featured players'],
  ['Explore featured profiles', 'View featured profiles'],
  ['Open Pro beta', 'Open CheckmateMore'],
  ['Practical chess guide', 'Chess guide'],
  ['Practical guide', 'Chess guide'],
  ['initiate game import from the browser', 'import your games from Chess.com'],
  ['initiate an eligible import', 'import your games'],
  ['Included direction', 'What you get'],
  ['full coaching experience', 'full game review and coaching tools'],
  ['future bot-creation capabilities as available in beta', 'private profile-based bots as they become available during beta'],
  ['processed games', 'analysed games'],
  ['games have been processed', 'games have been analysed'],
  ['enough games have been processed', 'enough games have been analysed'],
  ['customised, fully client-side engine review', 'clear Stockfish review in your browser'],
  ['Start free. Unlock the full picture with Pro.', 'Start free. Use Pro when you want more context.'],
  ['Start free. Add deeper coaching when it is useful.', 'Start free. Add Pro when you want coaching across more games.'],
  ['From your latest games to a practical plan.', 'From your latest games to a plan you can use.'],
  ['A coaching system built around how you play.', 'Coaching based on the games you actually play.'],
  ['Different chess goals, the same need for useful context.', 'Useful feedback for different kinds of player.'],
  ['Explore featured players through their processed games.', 'See how featured players approach real positions.'],
  ['How CheckmateMore turns your games into chess training.', 'How CheckmateMore helps you learn from your games.'],
  ['Four steps from game to practical next action', 'Four steps from game review to training'],
  ['Find recurring patterns', 'Spot mistakes that keep coming back'],
  ['recurring patterns', 'mistakes that keep coming back'],
  ['recurring themes', 'themes that keep appearing'],
  ['next eligible games', 'next few suitable games'],
  ['What to do next', 'Try this'],
  ['Deeper game analysis', 'More detailed game reviews'],
  ['Progress and profile insights', 'Progress and profile trends'],
  ['coaching insights', 'coaching notes'],
  ['strategy insights', 'strategic ideas'],
  ['richer coaching explanations', 'clearer coaching explanations'],
  ['deeper historical insight', 'a longer view of your games'],
  ['deeper analysis', 'more detailed analysis'],
  ['deeper trends', 'longer-term trends'],
  ['deeper personal analysis', 'more detailed personal analysis'],
  ['deeper profile', 'more detailed profile'],
  ['Deeper, multi-pass engine analysis', 'A more thorough, multi-pass engine review'],
  ['meaningful sample', 'useful sample'],
  ['meaningful moves', 'rated moves'],
  ['practical alternatives', 'playable alternatives'],
  ['practical objectives', 'clear objectives'],
  ['practical defence', 'sound defence'],
  ['practical moves', 'sound moves'],
  ['practical plan', 'clear plan'],
  ['practical next action', 'clear action'],
  ['Practical next action', 'Clear action'],
  ['take your chess to the next level', 'understand your games more clearly'],
  ['Chess Opening Mistakes by Rating Band', 'Chess opening mistakes by rating band'],
  ['How to Find Recurring Mistakes in Your Chess Games', 'How to find mistakes that keep coming back'],
  ['How to Review Your Chess Games', 'How to review your chess games'],
  ['How to Stop Hanging Your Queen in Chess', 'How to stop hanging your queen in chess'],
  ['What Does Chess Accuracy Mean?', 'What does chess accuracy mean?'],
  ['Why You Lose Winning Chess Positions', 'Why you lose winning chess positions'],
  ['Queen Hangs in 1000–1500-Rated Games', 'Queen hangs in 1000–1500-rated games'],
  ['Openings With the Most Blunders in Our Analysed Sample', 'Openings with the most blunders in our analysed sample'],
  ['Common Chess Blunders by Rating Band', 'Common chess blunders by rating band'],
  ['Clock Pressure and Chess Mistakes', 'Clock pressure and chess mistakes']
  ,['The practical cure is to reduce the opponent’s activity before chasing the fastest win.', 'The cure is to reduce your opponent’s activity before chasing the quickest win.']
  ,['extract one practical lesson', 'take one clear lesson from the game']
  ,['direct explanations, examples, and practical next steps', 'direct explanations, worked examples and clear advice']
  ,['what happened, why was the practical decision difficult, has the same theme appeared before, and what should you practise next?', 'what happened, why was the choice difficult, whether the same theme has appeared before and what you should practise next?']
  ,['A best line or practical answer demonstrates the preferred decision where available.', 'A best line shows what the position called for, when one is available.']
  ,['Normal Chess.com game import is initiated in your browser. Processed games can be stored in your CheckmateMore account;', 'You import your Chess.com games in the browser. Analysed games can then be saved to your CheckmateMore account;']
  ,['recurring-pattern insights', 'notes on mistakes that keep coming back']
  ,['Game insights', 'Game notes']
  ,['fast, practical breakdown', 'quick, clear review']
  ,['then unlock deeper Pro analysis', 'then choose Pro for more detailed reviews']
  ,['a coaching system that becomes more personal', 'coaching that becomes more personal']
  ,['connected profile insights', 'a connected profile view']
  ,['Progress insights', 'Progress trends']
  ,['turn them into practical work for the week ahead', 'choose what to work on in the week ahead']
  ,['Endgame insights', 'Endgame notes']
  ,['Clock-data insights', 'Clock notes']
  ,['meaningful game history', 'useful run of games']
  ,['unlock deeper Pro analysis', 'get more detailed Pro reviews']
  ,['Deeper Pro features', 'More detailed Pro features']
  ,['deeper coaching, analysis, training, and preparation features', 'more detailed coaching, review, training and preparation tools']
  ,['deeper coaching, history, training, and preparation', 'more detailed coaching, game history, training and preparation']
  ,['the deeper connected experience', 'more detail across your saved games']
  ,['Use Lite. no account needed', 'Review a game in Lite']
  ,['Create a free account or try Pro', 'Create a free account']
  ,['Try Pro Version', 'View Pro plans']
  ,['Explore featured', 'View featured']
  ,['the player’s Chess.com, FIDE, or over-the-board rating', 'the player’s real Chess.com, FIDE or over-the-board rating']
  ,['A player can link a Chess.com profile and import your games from Chess.com.', 'Yes. Link a Chess.com profile and import its games.']
]);

for (const file of htmlFiles) {
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of common) text = text.replaceAll(from, to);
  text = text.replaceAll(' — ', '. ').replaceAll('—', '-');
  fs.writeFileSync(file, text);
}

const liteFiles = [
  'chess/app/index.html', 'js/chess/analysis.js', 'js/chess/app.js', 'js/chess/cache.js',
  'js/chess/constants.js', 'js/chess/insights.js', 'js/chess/learning.js',
  'js/chess/openings.js', 'js/chess/pieces.js', 'js/chess/scoring.js',
  'js/chess/tactics.js', 'js/chess/ui.js'
];
const lite = new Map([
  ['Load your Chess.com profile or game for a clear Stockfish review in your browser. Insights across recent games, openings, and learnable theory. open About in the top menu for how labels work.', 'Load a Chess.com profile or one game for a Stockfish review in your browser. Open About to see how the labels work.'],
  ['Lite app. load your Chess.com profile or game for a clear Stockfish review in your browser. Insights across recent games, openings, and learnable theory. open About for how labels work.', 'Lite reviews Chess.com games in your browser. Open About to see how the labels work.'],
  ['Pro unlocks more detailed analysis, longer-term patterns, and richer coaching.', 'Pro adds more thorough reviews, longer-term trends and fuller coaching.'],
  ['Starter coaching and profile insights', 'Starter coaching and profile trends'],
  ['Turn these games into a connected profile.', 'Build a profile from these games.'],
  ['Save this review and analyse it with more context.', 'Save this review and compare it with your other games.'],
  ['Connected profile trends and mistakes that keep coming back', 'Trends across your saved games'],
  ['What you did here:', 'Why this move matters:'],
  ['Strong, practical move.', 'Strong, playable move.'],
  ['sound practical play', 'sound play'],
  ['No checkmate wins in this sample yet. wins by resignation/timeout won’t appear here.', 'No checkmate wins in this sample yet. Wins by resignation or timeout aren’t included here.'],
  ['Nothing new to analyze. using cached games only.', 'There are no new games to analyse, so Lite will use the saved reviews.'],
  ['Your overview will fill in as games finish analyzing.', 'Your overview will fill in as each game finishes analysing.'],
  ['Only ${games} analyzed game${games === 1 ? \'\' : \'s\'} so far. reads will sharpen after ~8–10.', 'Only ${games} analysed game${games === 1 ? \'\' : \'s\'} so far. The picture will become clearer after about eight to ten games.'],
  ['Not enough opening samples yet for a first read. keep analysing games.', 'There aren’t enough opening samples yet. Analyse a few more games first.'],
  ['This is a game-level signal, not a player rating.', 'This estimates how this game was played. It isn’t your real rating.'],
  ['Estimated game level', 'Estimated game performance'],
  ['game-level signal', 'single-game estimate'],
  ['meaningful play', 'rated play'],
  ['meaningful engine data', 'rated engine data'],
  ['meaningful moves', 'rated moves'],
  ['deeper-pass signal', 'second engine check'],
  ['deeper idea', 'second-pass idea'],
  ['Deeper idea', 'Second-pass idea'],
  ['Deepen analysis', 'Run a fuller review'],
  ['deepen analysis', 'run a fuller review'],
  ['Deeper re-search', 'Fuller re-search'],
  ['deeper re-search', 'fuller re-search'],
  ['deeper pass', 'second pass'],
  ['Deeper pass', 'Second pass']
  ,['Analyze', 'Analyse']
  ,['Initializing…', 'Starting engine…']
  ,['System initializing...', 'Starting Lite...']
  ,['Average move accuracy across analyzed games · click a point to open that game', 'Average move accuracy across analysed games. Select a point to open that game.']
  ,['Stable Chess.com rating vs volatile estimated Game ELO from each game’s move accuracy. stems show the gap · click a point to open that game', 'Chess.com rating compared with the estimated performance in each game. Select a point to open that game.']
  ,['Overview plus opening / middlegame / endgame reads. built from openings, phases, tactics, material events, and move quality.', 'A game-by-game view of your opening, middlegame and endgame play.']
  ,['How often each tactical or positional theme shows up across your games. click evidence to jump to the move.', 'See how often each tactical or positional theme appears. Select an example to jump to the move.']
  ,['Re-analyze this game at higher engine depth', 'Run this game review again with a fuller engine search']
  ,['Detailed analysis results appear here.', 'Choose a move to see the review.']
  ,['analyzed games', 'analysed games']
  ,['analyzed results', 'analysed results']
  ,['games are analyzed', 'games are analysed']
  ,['game is analyzed', 'game is analysed']
  ,['games finish analyzing', 'games finish analysing']
  ,['games are still analyzing', 'games are still being analysed']
  ,['locally analyzed', 'locally analysed']
  ,['analyzed game', 'analysed game']
  ,['games with PGNs are analyzed', 'games with PGNs are analysed']
  ,['Preparing analysis insights…', 'Preparing your review…']
  ,['Analysis insights ready.', 'Your review is ready.']
  ,['Review a profile or a few single games to unlock coaching.', 'Review a profile or a few games to start building coaching notes.']
  ,['A few more games in your main lines will unlock family-specific notes.', 'Analyse a few more games in your main lines to see opening-family notes.']
  ,['Prioritize White repertoire and early plans. the colour gap is real in this sample.', 'Prioritise your White repertoire and early plans. The colour gap is clear in this sample.']
  ,['Prioritize Black defences. you’re underperforming with that colour.', 'Prioritise your Black defences. Your results are weaker with that colour.']
  ,['Small edges added up. practical moves and fewer serious errors than your opponent.', 'Small edges added up. You found sound moves and made fewer serious errors than your opponent.']
  ,['Strong, practical opponent move.', 'Strong, playable move from your opponent.']
  ,['Pros and cons of how you handle each piece type. with an example move when we have one.', 'What went well and what went wrong with each piece type, with an example move where available.']
  ,['Cached games are stored per depth. switching presets may re-analyze.', 'Saved reviews use the selected depth. Changing preset may analyse those games again.']
  ,['Some presets re-search sharp moments a bit deeper.', 'Some presets spend more time on sharp positions.']
  ,['Deepen a review to track top-2 engine hits.', 'Run a fuller review to compare the engine’s top two moves.']
  ,['MultiPV / deepen', 'Top engine choices']
  ,['Practical move at depth ${signal.depthFrom}: ${practical}. Second-pass idea at depth ${signal.depthTo}: ${deeper}.', 'First engine choice at depth ${signal.depthFrom}: ${practical}. Second-pass choice at depth ${signal.depthTo}: ${deeper}.']
]);
for (const rel of liteFiles) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, 'utf8');
  for (const [from, to] of lite) text = text.replaceAll(from, to);
  text = text.replaceAll(' — ', '. ').replaceAll('—', '-');
  fs.writeFileSync(file, text);
}
