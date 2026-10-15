import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://checkmatemore.com';
const app = 'https://app.checkmatemore.com/';
const publishedIso = '2026-10-10';
const publishedLabel = '10 October 2026';

const posts = [
  {
    slug: 'how-to-review-a-chess-game-without-chasing-accuracy',
    title: 'How to Review a Chess Game Without Chasing Accuracy',
    description: 'Review a chess game by reconstructing your decisions first, then use engine analysis to understand the moments that changed the position.',
    intro: 'Accuracy is a useful summary, but it cannot tell you what you misunderstood. A good review starts with your own recollection of the game, then uses the engine to test the decisions that mattered.',
    body: `
      <h2>Accuracy is the end of a calculation, not the start of an explanation</h2>
      <p>An accuracy score compresses a whole game into one number. Two games with the same score can contain very different lessons. In one, you may have played sensibly until a single tactical oversight. In another, you may have made several small positional concessions that were difficult to punish.</p>
      <p>The number is useful for comparing the general cleanliness of games. It is poor at answering the question an improving player actually has: what should I notice next time?</p>
      <h2>Replay the game before opening the engine</h2>
      <h3>Recover what you were trying to do</h3>
      <p>Play through the moves and stop where you remember thinking for a long time, feeling uncertain or choosing between plans. Write down the candidate moves you considered. If you cannot remember them, note what you understood about the position instead.</p>
      <h3>Mark decisions, not only mistakes</h3>
      <p>A move can be objectively fine and still reveal a weak decision process. Suppose you play 18.Rd1 because the rook belongs on an open file, but you never check that Black has 18...Bxh2+. The move may survive tactically in this position, yet the missing safety check is worth recording.</p>
      <h2>Use the engine to test your account of the game</h2>
      <p>Now compare your candidates with the engine. Look first at large evaluation changes, missed forcing moves and moments where your plan differed from the best continuation. Do not copy a five-move line without asking why its first move works.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative example</span><h3>A quiet move before the blunder</h3><p>White eventually loses a rook to a fork on move 24. The useful review point may be move 21, when White pushed a pawn and removed the knight's retreat square. The later fork is the visible error. The earlier decision explains why it became possible.</p></div>
      <h2>What to do next</h2>
      <p>Choose one critical position. Record what you considered, what you missed and one short decision rule for a similar position. Then use a <a href="../../chess-game-analysis/">game review with clear explanations</a> or try the same method in <a href="../../chess/app/">CheckmateMore Lite</a>.</p>`
  },
  {
    slug: 'what-repeated-chess-mistakes-are-trying-to-tell-you',
    title: 'What Your Repeated Chess Mistakes Are Trying to Tell You',
    description: 'Separate isolated chess errors from recurring habits across openings, middlegames, endgames and time pressure.',
    intro: 'One bad move may be noise. The same kind of decision appearing in several games is a better training signal. The work is to describe the habit precisely enough that you can recognise it over the board.',
    body: `
      <h2>A repeated label is not yet a repeated cause</h2>
      <p>Three blunders do not automatically form one pattern. One might be a missed back-rank mate, another a calculation error in a pawn ending, and the third a mouse slip. Group mistakes by the decision behind them, not only by severity.</p>
      <h2>Look for habits in each phase</h2>
      <h3>Opening decisions</h3>
      <p>You may leave theory safely but repeatedly spend two tempi moving the same piece while your king stays in the centre. The habit is not “bad opening”. It is delaying development to chase a small threat.</p>
      <h3>Middlegame decisions</h3>
      <p>A player may attack before finishing development whenever the opponent's king looks exposed. Sometimes the attack works. Across several games, the repeated choice may still show that excitement is replacing a check of defenders and counterplay.</p>
      <h3>Endgame decisions</h3>
      <p>Repeatedly activating the king too late is different from forgetting one theoretical position. The first is a planning habit. The second may call for targeted study.</p>
      <h3>Time-pressure decisions</h3>
      <p>If errors cluster after long thinks on ordinary moves, the training problem may be clock allocation. If they occur in every sharp position, the calculation routine may be the stronger signal.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative example</span><h3>The queen is not the real pattern</h3><p>A player loses the queen twice in ten games. In both positions they moved it to attack a loose pawn without checking the opponent's forcing reply. “Queen hang” describes the outcome. “Starting an attack before checking checks and captures” describes the habit.</p></div>
      <h2>What to do next</h2>
      <p>Tag the cause of each critical decision across a small set of games. Keep a category only when the situations are genuinely comparable. The <a href="../../guides/how-to-find-recurring-chess-mistakes/">guide to recurring chess mistakes</a> and <a href="../../weekly-chess-coaching/">weekly coaching overview</a> explain how CheckmateMore treats repeated evidence.</p>`
  },
  {
    slug: 'decision-dna-finding-the-choices-you-repeat-in-chess',
    title: 'Decision DNA: Finding the Choices You Repeat in Chess',
    description: 'Learn how Decision DNA examines recurring choices, themes and practical patterns across a player’s own chess games.',
    intro: 'Decision DNA is a way of looking across your own games for choices that keep returning. It is less interested in one opening name or one accuracy score than in how you respond when similar decisions arise.',
    body: `
      <h2>What Decision DNA looks for</h2>
      <p>The same position rarely appears twice. The same type of decision appears often. You may exchange tension whenever calculation becomes uncomfortable, push flank pawns before securing the centre, or choose passive defence when active counterplay is available.</p>
      <h3>Situations need context</h3>
      <p>A queen trade is not cautious by definition. Trading queens while behind may reduce your chances, while the same trade with an extra pawn may be sensible. Decision DNA needs the situation, the alternatives and the practical result of the choice.</p>
      <h3>Frequency is not the whole story</h3>
      <p>A common choice can be healthy. A rare mistake can be severe. Useful analysis considers how often the opportunity occurred, what you chose and whether the choice helped or harmed the position.</p>
      <h2>From theme to trainable question</h2>
      <p>Broad labels such as “too aggressive” are difficult to practise. A narrower question is better: when the opponent attacks one of your pieces, do you respond to the attack before checking your own forcing moves?</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative methodology</span><h3>Releasing central tension</h3><p>Across six eligible middlegames, a player captures in the centre at the first opportunity. In four of them, keeping the tension would restrict the opponent. The useful pattern is not “captures are bad”. It is “resolving tension before identifying which side benefits”.</p></div>
      <h2>What CheckmateMore can and cannot conclude</h2>
      <p>CheckmateMore can organise evidence from analysed games and surface recurring choices when enough comparable opportunities exist. It should not claim that a small sample defines a player permanently. A pattern is a prompt for attention, not a personality verdict.</p>
      <h2>What to do next</h2>
      <p>Pick one repeated choice and write the question you want to ask before making it again. Read how this connects to <a href="../../how-it-works/">analysis and personal training</a>, then see how <a href="../../improvement-proof/">Improvement Proof</a> checks later decisions.</p>`
  },
  {
    slug: 'why-stockfish-alone-does-not-explain-a-human-chess-mistake',
    title: 'Why Stockfish Alone Does Not Explain a Human Chess Mistake',
    description: 'Understand the difference between objective engine evaluation and the practical reasons a human chess player chooses a move.',
    intro: 'Stockfish is excellent at showing which moves are strongest. It does not know what you saw, what you feared or why one continuation felt natural. Those are different questions.',
    body: `
      <h2>Engine evaluation describes the position</h2>
      <p>An engine compares moves under deep calculation. A sharp move may be objectively best because every tactical detail works. A quiet move may lose an advantage because it gives the opponent one precise resource.</p>
      <p>This is essential evidence. Without it, an explanation can recommend a move that simply fails. But evaluation alone does not tell us why a human mistake was likely.</p>
      <h2>Human difficulty depends on the decision</h2>
      <h3>Visibility</h3>
      <p>A backward knight move may be hard to see even when its purpose is simple. A forcing capture is easier to notice, although its consequences may be harder to calculate.</p>
      <h3>Choice overload</h3>
      <p>A position with four plausible plans can be harder than a tactical position with one forced line. The evaluation may treat both as equally clear after calculation.</p>
      <h3>Familiar habits</h3>
      <p>Players often choose moves that match plans they know. That can help in familiar structures and mislead them when one tactical detail changes the position.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative example</span><h3>The natural recapture</h3><p>After ...Bxc3, White automatically recaptures with the b-pawn. Stockfish prefers the queen because the open b-file gives Black immediate play. The engine identifies the difference. A useful human explanation also notes that automatic recapture habits can bypass a fresh check of the resulting structure.</p></div>
      <h2>How CheckmateMore combines the evidence</h2>
      <p>For eligible Pro and Unlimited users, CheckmateMore combines Stockfish analysis with human-tendency analysis. Maia-related signals can add context about human move choices, but they do not read a player's mind or prove a psychological cause. Conclusions should remain tied to the analysed positions and the available sample.</p>
      <h2>What to do next</h2>
      <p>For each engine recommendation, explain its first purpose in your own words. Then ask why your move felt attractive. Compare the approach with <a href="../../chess-game-analysis/">CheckmateMore game analysis</a> and the <a href="../../compare/chess-com-analysis/">analysis comparison page</a>.</p>`
  },
  {
    slug: 'from-a-missed-tactic-to-a-useful-training-position',
    title: 'From a Missed Tactic to a Useful Training Position',
    description: 'Turn a missed tactic from your own chess game into personal practice that trains the pattern rather than one memorised answer.',
    intro: 'A missed tactic is useful training material because it happened in a position you understood imperfectly. The aim is not to memorise one engine line. It is to recognise the trigger when a related position appears again.',
    body: `
      <h2>Start with the decision before the tactic</h2>
      <p>The final combination may be forced, but the learning point often appears one move earlier. What changed? Did a defender move, did a line open, or did the king lose an escape square?</p>
      <h3>Keep the original context</h3>
      <p>Record the opening, your plan and the clock situation. A fork missed with thirty seconds left may need a different response from the same fork missed after an eight-minute think.</p>
      <h2>Build a position that tests recognition</h2>
      <p>Begin from the last moment when the critical idea was available. Hide the answer. Before moving, list checks, captures and threats, then identify loose pieces and overloaded defenders.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative training position</span><h3>Remove the defender first</h3><p>You missed a knight fork because a pawn defended the entry square. The useful exercise begins before the forcing exchange that removes that pawn. Solving only the final fork would train the last move, not the preparation that made it possible.</p></div>
      <h2>Repeat the pattern without copying the answer</h2>
      <p>Return to the original position after a delay, then practise a related position with the same tactical mechanism. Say the theme and the opponent's best defence. Correct recall is stronger when you can explain why the move works.</p>
      <h3>Know when a position is unsuitable</h3>
      <p>Not every engine swing makes a fair puzzle. Exclude positions with several equally good moves, unclear compensation or a solution that depends on a long, unnatural engine line.</p>
      <h2>What to do next</h2>
      <p>Save one clean critical position from your latest game and write the recognition cue beside it. See how <a href="../../chess-tactics-practice-from-your-games/">personal chess tactics practice</a> works, or start with the evergreen guide on <a href="../../guides/how-to-review-chess-games/">reviewing your games</a>.</p>`
  },
  {
    slug: 'improvement-proof-how-to-tell-whether-training-is-changing-your-decisions',
    title: 'Improvement Proof: How to Tell Whether Training Is Changing Your Decisions',
    description: 'Use baselines, relevant opportunities and later games to judge whether chess training is changing a repeated decision.',
    intro: 'One clean game after training feels encouraging, but it is not proof that a habit has changed. Improvement Proof compares a baseline with later relevant opportunities and reports only what the evidence supports.',
    body: `
      <h2>Begin with a baseline</h2>
      <p>A baseline describes the behaviour before focused practice. It needs a specific decision and enough eligible opportunities. “I blunder too much” is too broad. “I move an attacked piece without checking my own forcing moves” can be observed.</p>
      <h2>Practise the decision you want to change</h2>
      <p>Use positions that contain the same trigger. Rehearse the process, not only the correct move. For example: notice the attack, list forcing moves for both sides, then compare candidate moves.</p>
      <h2>Wait for relevant opportunities</h2>
      <h3>Later games must test the same habit</h3>
      <p>A game with no comparable decision tells us nothing about that objective. Evidence accumulates only when the trained situation genuinely appears again.</p>
      <h3>One success is encouraging, not conclusive</h3>
      <p>You may choose correctly once because the position is easier, the move is forced or the pattern is fresh in memory. Several later opportunities provide a fairer view.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative evidence states</span><h3>What an honest report can say</h3><p><strong>Not enough evidence:</strong> no later eligible opportunity. <strong>Early signal:</strong> one or two correct decisions. <strong>Mixed:</strong> the new process appears, but the old habit still returns. <strong>Sustained:</strong> enough later opportunities show a consistent change under the stated rule.</p></div>
      <h2>Keep rating separate from the habit</h2>
      <p>A corrected decision may not immediately change results or rating. Opponent strength, openings and many other decisions affect each game. Improvement Proof does not guarantee a rating outcome.</p>
      <h2>What to do next</h2>
      <p>Write one measurable decision rule and define what counts as an eligible opportunity. Read the full <a href="../../improvement-proof/">Improvement Proof explanation</a> and how it fits into <a href="../../weekly-chess-coaching/">personalised weekly coaching</a>.</p>`
  },
  {
    slug: 'how-to-build-a-chess-training-plan-from-your-own-games',
    title: 'How to Build a Chess Training Plan From Your Own Games',
    description: 'Build a manageable chess training plan from game review, recurring patterns, weekly objectives, personal puzzles and later games.',
    intro: 'A useful training plan does not need many activities. It needs a clear link between the games you played, the decisions that caused trouble and the practice you can repeat this week.',
    body: `
      <h2>Step 1: review a small, recent sample</h2>
      <p>Start with games that still feel familiar. Replay each one without the engine, mark uncertain decisions, then use analysis to check the critical positions. Avoid collecting every small inaccuracy.</p>
      <h2>Step 2: group comparable decisions</h2>
      <p>Look for causes that repeat. Opening memory, tactical scanning, exchanges, pawn breaks, conversion and clock use are useful areas, but the final description should be specific to your games.</p>
      <h2>Step 3: choose one or two weekly objectives</h2>
      <h3>Make each objective observable</h3>
      <p>“Improve calculation” is vague. “Before every forcing move, calculate the opponent's checks and captures” gives you a routine that can be seen in later positions.</p>
      <h3>Keep the week manageable</h3>
      <p>One important habit practised properly is better than seven themes skimmed once. Add an opening or endgame study item only when the reviewed games support it.</p>
      <h2>Step 4: practise positions from the games</h2>
      <p>Use personal puzzles for tactical moments. For strategic choices, return to the position and compare plans. Explain the purpose of the preferred move before checking the line.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative weekly routine</span><h3>A focused programme</h3><p><strong>Monday:</strong> review two recent games. <strong>Tuesday and Thursday:</strong> solve five personal positions and explain the theme. <strong>Saturday:</strong> play, then note every eligible opportunity for the weekly objective. <strong>Sunday:</strong> review the evidence without changing the objective too quickly.</p></div>
      <h2>Step 5: review what happened in later games</h2>
      <p>Keep, adjust or retire the objective according to relevant evidence. Do not treat a win as proof that every decision improved, or a loss as proof that training failed.</p>
      <h2>What to do next</h2>
      <p>Choose two recent games and write one decision rule for the week. The <a href="../../how-it-works/">CheckmateMore coaching loop</a> connects this routine, while the <a href="../../pricing/">plans page</a> explains what is available with a free account and paid plans.</p>`
  },
  {
    slug: 'practical-chess-analysis-for-players-who-are-stuck',
    title: 'Practical Chess Analysis for Players Who Are Stuck',
    description: 'Use practical chess analysis to diagnose a plateau without assuming every player at the same rating has the same problem.',
    intro: 'Feeling stuck often leads players to add more puzzles, more openings and more videos at once. A better first move is to inspect where your own decisions are breaking down.',
    body: `
      <h2>A plateau is a description, not a diagnosis</h2>
      <p>Two players with the same rating can need very different work. One reaches good positions and loses them in time pressure. Another remembers openings but misses simple threats. Rating bands provide context, not a guaranteed list of weaknesses.</p>
      <h2>Find where good positions start becoming difficult</h2>
      <h3>Opening transition</h3>
      <p>Do you know moves but not the plan after theory ends? Review the first position where you felt unsure, not only the first move the engine disliked.</p>
      <h3>Tactical control</h3>
      <p>Separate missed patterns from calculation errors. If you never considered the tactic, train recognition. If you saw it but miscalculated the reply, train the calculation process.</p>
      <h3>Conversion and defence</h3>
      <p>When ahead, check whether you allow unnecessary counterplay. When worse, check whether you create practical problems or drift into passive moves.</p>
      <h3>Clock use</h3>
      <p>Look at what you spent time on. Long thinks are useful only when the position deserves them. Repeatedly using half your time before the first critical decision can make later mistakes predictable.</p>
      <div class="cm-example"><span class="cm-example-badge">Illustrative diagnosis</span><h3>Good openings, difficult middlegames</h3><p>A player scores well from a familiar opening but stalls once the centre changes. Their next study block should not add another variation. It should compare several transition positions and practise choosing between a pawn break, a piece improvement and prophylaxis.</p></div>
      <h2>Change one part of the routine</h2>
      <p>Choose the clearest repeated decision and work on it for a short block. Keep playing enough games to create later evidence. If the issue does not recur, record that honestly rather than declaring it fixed.</p>
      <h2>What to do next</h2>
      <p>Review five recent games and identify the first difficult decision in each. Compare your notes with the guide to <a href="../../guides/how-to-find-recurring-chess-mistakes/">finding repeated mistakes</a> and the product page for <a href="../../chess-game-analysis/">practical game analysis</a>.</p>`
  }
];

const bySlug = new Map(posts.map(post => [post.slug, post]));
const relatedSlugs = {
  'how-to-review-a-chess-game-without-chasing-accuracy': ['what-repeated-chess-mistakes-are-trying-to-tell-you', 'from-a-missed-tactic-to-a-useful-training-position'],
  'what-repeated-chess-mistakes-are-trying-to-tell-you': ['decision-dna-finding-the-choices-you-repeat-in-chess', 'how-to-build-a-chess-training-plan-from-your-own-games'],
  'decision-dna-finding-the-choices-you-repeat-in-chess': ['what-repeated-chess-mistakes-are-trying-to-tell-you', 'improvement-proof-how-to-tell-whether-training-is-changing-your-decisions'],
  'why-stockfish-alone-does-not-explain-a-human-chess-mistake': ['how-to-review-a-chess-game-without-chasing-accuracy', 'decision-dna-finding-the-choices-you-repeat-in-chess'],
  'from-a-missed-tactic-to-a-useful-training-position': ['how-to-review-a-chess-game-without-chasing-accuracy', 'how-to-build-a-chess-training-plan-from-your-own-games'],
  'improvement-proof-how-to-tell-whether-training-is-changing-your-decisions': ['decision-dna-finding-the-choices-you-repeat-in-chess', 'how-to-build-a-chess-training-plan-from-your-own-games'],
  'how-to-build-a-chess-training-plan-from-your-own-games': ['what-repeated-chess-mistakes-are-trying-to-tell-you', 'practical-chess-analysis-for-players-who-are-stuck'],
  'practical-chess-analysis-for-players-who-are-stuck': ['how-to-build-a-chess-training-plan-from-your-own-games', 'why-stockfish-alone-does-not-explain-a-human-chess-mistake']
};

function organisationGraph() {
  return [{
    '@type': 'Organization', '@id': `${origin}/#organization`, name: 'CheckmateMore', alternateName: 'CheckmateMore Pro',
    legalName: 'Green Shell Media', url: `${origin}/`, logo: `${origin}/assets/android-chrome-512x512.png`,
    sameAs: ['https://www.instagram.com/checkmatemore/'],
    email: 'hello@checkmatemore.com', contactPoint: [
      { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@checkmatemore.com', url: `${origin}/contact/` },
      { '@type': 'ContactPoint', contactType: 'privacy', email: 'privacy@checkmatemore.com', url: `${origin}/privacy/` }
    ]
  }, {
    '@type': 'WebSite', '@id': `${origin}/#website`, name: 'CheckmateMore', alternateName: ['CheckmateMore Pro', 'Checkmate More'],
    url: `${origin}/`, publisher: { '@id': `${origin}/#organization` }
  }];
}

function breadcrumbs(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], index) => ({
    '@type': 'ListItem', position: index + 1, name, item: url
  })) };
}

function head({ title, description, canonical, type = 'website', graph }) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="CheckmateMore">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${origin}/assets/social-card.svg">
  <meta property="og:image:alt" content="CheckmateMore, chess analysis that remembers how you play">
  ${type === 'article' ? `<meta property="article:published_time" content="${publishedIso}">
  <meta property="article:modified_time" content="${publishedIso}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${origin}/assets/social-card.svg">
  <meta name="twitter:image:alt" content="CheckmateMore, chess analysis that remembers how you play">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#101914">
  <meta name="color-scheme" content="light dark">
  <script src="/js/site-theme.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeng@17.18.15/resources/primeng.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/primeicons@7.0.0/primeicons.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Datatype:wdth,wght@50..100,100..900&family=Domine:wght@400..700&family=Inter:wght@100..900&display=swap">
  <link rel="stylesheet" href="/chess-landing.css?v=20261010a">
  <link rel="stylesheet" href="/brand.css?v=20260829d">
  <script src="/js/clean-url.js"></script>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c')}</script>
  <script src="/js/affiliate-attribution.js"></script>
  <script type="text/javascript" src="https://api.goaffpro.com/loader.js?shop=pmnkfjiswh"></script>
  <link rel="alternate" hreflang="en-GB" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
</head>`;
}

const logo = `<span class="cm-logo-assets"><img class="cm-logo-light" src="/assets/checkmatemore-logo-black.svg" alt="CheckmateMore"><img class="cm-logo-dark" src="/assets/checkmatemore-logo-white.svg" alt="CheckmateMore"></span>`;
function header(current) {
  return `<a class="cm-skip" href="#main">Skip to content</a><header class="cm-top"><div class="cm-wrap cm-nav-wrap">
    <a class="cm-logo" href="/" aria-label="CheckmateMore home">${logo}</a>
    <nav class="cm-nav" aria-label="Primary navigation"><a href="/how-it-works/">How it works</a><a href="/guides/">Guides</a><a href="/blog/"${current === 'blog' ? ' class="is-current"' : ''}>Blog</a><a href="/pricing/">Pricing</a><a href="/about-checkmatemore/"${current === 'about' ? ' class="is-current"' : ''}>About</a><a href="/chess/app/" class="p-button p-component p-button-sm cm-btn">Use Lite</a><a href="${app}" class="p-button p-component p-button-sm cm-primary"><span class="p-button-label">Create free account</span></a></nav>
    <div class="cm-nav-compact"><a href="/chess/app/" class="p-button p-component p-button-sm cm-btn">Use Lite</a><a href="${app}" class="p-button p-component p-button-sm cm-primary"><span class="p-button-label">Free account</span></a><details class="cm-nav-menu"><summary aria-label="Open menu"><i class="pi pi-bars" aria-hidden="true"></i></summary><div class="cm-nav-drawer"><a href="/how-it-works/">How it works</a><a href="/guides/">Guides</a><a href="/blog/">Blog</a><a href="/pricing/">Pricing</a><a href="/about-checkmatemore/">About CheckmateMore</a><a href="/chess-game-analysis/">Game analysis</a><a href="/weekly-chess-coaching/">Weekly coaching</a></div></details></div>
  </div></header>`;
}

function footer() {
  return `<footer class="cm-footer"><div class="cm-wrap cm-footer-grid"><div><a class="cm-logo" href="/" aria-label="CheckmateMore home">${logo}</a><p>Chess analysis that remembers how you play.</p></div><div><h3>Product</h3><a href="/how-it-works/">How it works</a><a href="/chess-game-analysis/">Game analysis</a><a href="/weekly-chess-coaching/">Weekly coaching</a><a href="/improvement-proof/">Improvement Proof</a><a href="/pricing/">Pricing</a></div><div><h3>Learn</h3><a href="/blog/">Blog</a><a href="/guides/">Chess guides</a><a href="/research/">Research notes</a><a href="/chess-tactics-practice-from-your-games/">Personal puzzles</a><a href="/play-chess-bots/">Chess bots</a></div><div><h3>Company</h3><a href="/about-checkmatemore/">About CheckmateMore</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="${app}">Create a free account</a><a href="https://www.instagram.com/checkmatemore/">Instagram</a></div></div></footer>`;
}

function shell({ headHtml, current, main }) {
  return `<!doctype html><html lang="en-GB">${headHtml}<body class="cm-landing cm-editorial">${header(current)}<main id="main">${main}</main>${footer()}</body></html>`;
}

function write(route, html) {
  const destination = path.join(root, route, 'index.html');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html, 'utf8');
}

const hubCanonical = `${origin}/blog/`;
const hubGraph = [...organisationGraph(), {
  '@type': 'CollectionPage', '@id': `${hubCanonical}#webpage`, name: 'CheckmateMore chess improvement blog',
  description: 'Practical chess improvement writing based on real games, repeated decisions, personal practice and evidence of change.',
  url: hubCanonical, isPartOf: { '@id': `${origin}/#website` }, about: { '@id': `${origin}/#organization` }
}, breadcrumbs([['Home', `${origin}/`], ['Blog', hubCanonical]])];
const cards = posts.map(post => `<article class="cm-card cm-blog-card" data-tone="accuracy"><time datetime="${publishedIso}">${publishedLabel}</time><h2><a href="/blog/${post.slug}/">${post.title}</a></h2><p>${post.intro}</p><a class="cm-text-link" href="/blog/${post.slug}/">Read article <span aria-hidden="true">→</span></a></article>`).join('');
write('blog', shell({
  current: 'blog',
  headHtml: head({ title: 'Chess Improvement Blog | CheckmateMore', description: 'Practical chess writing about reviewing real games, repeated decisions, personal training and evidence that habits are changing.', canonical: hubCanonical, graph: hubGraph }),
  main: `<section class="cm-page-hero"><div class="cm-wrap"><nav class="cm-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog/">Blog</a></nav><p class="cm-eyebrow">CheckmateMore blog</p><h1>Practical chess improvement, grounded in the games you play.</h1><p class="cm-lede">CheckmateMore publishes careful writing about reviewing real games, finding recurring patterns, choosing useful training and checking whether decisions change later. Chess analysis that remembers how you play.</p></div></section><section class="cm-section cm-tinted"><div class="cm-wrap"><p class="cm-kicker">The coaching loop</p><h2>Analyse, understand, find the pattern, practise, then review.</h2><ol class="cm-blog-loop"><li>Analyse your own games</li><li>Understand the critical decisions</li><li>Find patterns that repeat</li><li>Practise the positions that matter</li><li>Review whether the habit changes in later games</li></ol></div></section><section class="cm-section"><div class="cm-wrap"><p class="cm-kicker">Latest articles</p><h2>Start with the question your games are asking.</h2><div class="cm-blog-grid">${cards}</div></div></section><section class="cm-final"><div class="cm-wrap"><p class="cm-kicker">Use your own games</p><h2>Turn the reading into a review.</h2><p>Create a free account to keep analysed games, puzzles and starter coaching together.</p><div class="cm-cta"><a href="${app}" class="p-button p-component cm-primary"><span class="p-button-label">Create a free account</span></a><a href="/guides/" class="p-button p-component cm-btn"><span class="p-button-label">Browse evergreen guides</span></a></div></div></section>`
}));

for (const post of posts) {
  const canonical = `${origin}/blog/${post.slug}/`;
  const related = relatedSlugs[post.slug].map(slug => bySlug.get(slug));
  const graph = [...organisationGraph(), {
    '@type': 'BlogPosting', '@id': `${canonical}#article`, headline: post.title, description: post.description,
    datePublished: publishedIso, dateModified: publishedIso, mainEntityOfPage: canonical,
    author: { '@id': `${origin}/#organization` }, publisher: { '@id': `${origin}/#organization` },
    image: { '@type': 'ImageObject', url: `${origin}/assets/social-card.svg`, caption: 'CheckmateMore, chess analysis that remembers how you play' },
    isPartOf: { '@id': `${origin}/#website` }
  }, breadcrumbs([['Home', `${origin}/`], ['Blog', hubCanonical], [post.title, canonical]])];
  const relatedCards = related.map(item => `<article class="cm-card"><h3><a href="/blog/${item.slug}/">${item.title}</a></h3><p>${item.intro}</p></article>`).join('');
  write(`blog/${post.slug}`, shell({
    current: 'blog',
    headHtml: head({ title: `${post.title} | CheckmateMore`, description: post.description, canonical, type: 'article', graph }),
    main: `<article><header class="cm-page-hero cm-article-hero"><div class="cm-wrap"><nav class="cm-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/blog/">Blog</a> / <span>${post.title}</span></nav><p class="cm-eyebrow">CheckmateMore blog</p><h1>${post.title}</h1><p class="cm-lede">${post.intro}</p><p class="cm-article-date"><time datetime="${publishedIso}">Published ${publishedLabel}</time></p></div></header><div class="cm-section cm-article-section"><div class="cm-wrap cm-article-layout"><div class="cm-prose">${post.body}</div><aside class="cm-article-aside"><p class="cm-kicker">The CheckmateMore loop</p><ol><li>Analyse your games</li><li>Understand decisions</li><li>Find repeated patterns</li><li>Practise key positions</li><li>Review later evidence</li></ol><a href="${app}" class="p-button p-component cm-primary"><span class="p-button-label">Try a free account</span></a></aside></div></div></article><section class="cm-section cm-tinted"><div class="cm-wrap"><p class="cm-kicker">Related reading</p><h2>Continue with the next decision.</h2><div class="cm-blog-related">${relatedCards}</div><nav class="cm-related" aria-label="Related CheckmateMore pages"><a href="/how-it-works/">How CheckmateMore works</a><a href="/guides/">Chess guides</a><a href="/blog/">All blog articles</a></nav></div></section><section class="cm-final"><div class="cm-wrap"><p class="cm-kicker">Chess analysis that remembers how you play</p><h2>Review the decisions behind the moves.</h2><p>Create a free account to keep your analysed games and training in one place.</p><div class="cm-cta"><a href="${app}" class="p-button p-component cm-primary"><span class="p-button-label">Create a free account</span></a><a href="/chess/app/" class="p-button p-component cm-btn"><span class="p-button-label">Use Lite without an account</span></a></div></div></section>`
  }));
}

const aboutCanonical = `${origin}/about-checkmatemore/`;
const aboutGraph = [...organisationGraph(), {
  '@type': 'AboutPage', '@id': `${aboutCanonical}#webpage`, name: 'About CheckmateMore', url: aboutCanonical,
  description: 'What CheckmateMore is, who it is for and how game analysis connects to personal practice and evidence of change.',
  isPartOf: { '@id': `${origin}/#website` }, about: { '@id': `${origin}/#organization` }
}, breadcrumbs([['Home', `${origin}/`], ['About CheckmateMore', aboutCanonical]])];
write('about-checkmatemore', shell({
  current: 'about',
  headHtml: head({ title: 'About CheckmateMore | Chess Analysis From Your Own Games', description: 'Learn what CheckmateMore does, who it is for and how analysis, repeated patterns, practice and Improvement Proof connect.', canonical: aboutCanonical, graph: aboutGraph }),
  main: `<section class="cm-page-hero"><div class="cm-wrap"><nav class="cm-crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/about-checkmatemore/">About CheckmateMore</a></nav><p class="cm-eyebrow">About CheckmateMore</p><h1>Chess analysis that remembers how you play.</h1><p class="cm-lede">CheckmateMore helps adult improvers review their own games, understand critical decisions, find patterns that repeat and practise positions that matter.</p></div></section><section class="cm-section cm-tinted"><div class="cm-wrap"><h2>More than a basic engine analysis board.</h2><div class="cm-loop"><article class="cm-card"><h3>Review the game</h3><p>Stockfish-backed analysis checks the position and identifies important changes.</p></article><article class="cm-card"><h3>Explain the decision</h3><p>Move context, plans and human-tendency analysis help describe why a choice was difficult where eligible.</p></article><article class="cm-card"><h3>Connect later games</h3><p>Repeated evidence can turn a single mistake into a focused training objective.</p></article></div></div></section><section class="cm-section"><div class="cm-wrap cm-prose-block"><h2>How the parts connect</h2><p>A game review is useful on its own. CheckmateMore becomes more useful when several reviews form a longer record. Recurring decisions can inform weekly objectives and personal practice positions. Improvement Proof then looks for relevant opportunities in later games and reports whether the evidence is early, mixed, insufficient or sustained.</p><p>CheckmateMore does not promise rating gains and does not replace a human coach. It organises engine-backed evidence and practical training material from the games a player chooses to analyse.</p><h2>Who it is for</h2><p>CheckmateMore is for chess players who want to understand their own decisions rather than collect another general list of tips. Lite supports a one-game browser review. A free account keeps eligible analysed games and adds a library, puzzles and starter coaching. Paid plans add broader coaching and analysis features as described on the current pricing page.</p><h2>Who operates CheckmateMore</h2><p>CheckmateMore is operated by Green Shell Media in Derby, United Kingdom. Product questions can be sent to <a href="mailto:hello@checkmatemore.com">hello@checkmatemore.com</a>, support requests to <a href="mailto:support@checkmatemore.com">support@checkmatemore.com</a>, and privacy requests to <a href="mailto:privacy@checkmatemore.com">privacy@checkmatemore.com</a>.</p><nav class="cm-related" aria-label="Explore CheckmateMore"><a href="${app}">Create a free account</a><a href="/how-it-works/">How it works</a><a href="/pricing/">Pricing</a><a href="/guides/">Guides</a><a href="/blog/">Blog</a></nav></div></section>`
}));

console.log(`Built blog hub, ${posts.length} articles and About CheckmateMore.`);
