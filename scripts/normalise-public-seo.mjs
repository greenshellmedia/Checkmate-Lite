import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = new Set(['es', 'fr', 'de', 'pt-br', 'it', 'nl', 'pl', 'uk', 'ru']);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'localization' || locales.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') files.push(full);
  }
}
walk(root);

const routeFor = file => {
  const relative = path.relative(root, file);
  return relative === 'index.html' ? '/' : `/${path.dirname(relative).replaceAll('\\', '/')}/`;
};
const relativePrefix = route => route === '/' ? '' : '../'.repeat(route.split('/').filter(Boolean).length);

function addNavigation(html, prefix) {
  const addToBlock = (block, drawer = false) => {
    let next = block;
    if (!/href="[^"]*blog\//.test(next)) {
      const link = `\n${drawer ? '            ' : '        '}<a href="${prefix}blog/">Blog</a>`;
      next = next.replace(/(<a\b[^>]*href="[^"]*guides\/"[^>]*>[^<]*Guides[^<]*<\/a>)/i, `$1${link}`);
    }
    if (!/href="[^"]*about-checkmatemore\//.test(next)) {
      const link = `\n${drawer ? '            ' : '        '}<a href="${prefix}about-checkmatemore/">About</a>`;
      next = next.replace(/(<a\b[^>]*href="[^"]*pricing\/"[^>]*>[^<]*Pricing[^<]*<\/a>)/i, `$1${link}`);
    }
    return next;
  };
  html = html.replace(/<nav class="cm-nav"[\s\S]*?<\/nav>/i, block => addToBlock(block));
  html = html.replace(/<div class="cm-nav-drawer">[\s\S]*?<\/div>/i, block => addToBlock(block, true));
  return html;
}

function addFooterLinks(html, prefix) {
  return html.replace(/<footer class="cm-footer">[\s\S]*?<\/footer>/i, footer => {
    let next = footer;
    if (!/href="[^"]*blog\//.test(next)) {
      next = next.replace(/(<h3>Learn<\/h3>)/i, `$1\n        <a href="${prefix}blog/">Blog</a>`);
    }
    if (!/href="[^"]*about-checkmatemore\//.test(next)) {
      next = next.replace(/(<h3>Company<\/h3>)/i, `$1\n        <a href="${prefix}about-checkmatemore/">About CheckmateMore</a>`);
    }
    return next;
  });
}

function improveStructuredData(html) {
  return html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/gi, (block, open, raw, close) => {
    try {
      const data = JSON.parse(raw);
      const visit = value => {
        if (Array.isArray(value)) return value.map(visit);
        if (!value || typeof value !== 'object') return value;
        const next = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]));
        const type = next['@type'];
        if (type === 'Organization' && (next.name === 'CheckmateMore' || next['@id'] === 'https://checkmatemore.com/#organization')) {
          Object.assign(next, {
            '@id': 'https://checkmatemore.com/#organization',
            name: 'CheckmateMore',
            alternateName: 'CheckmateMore Pro',
            legalName: 'Green Shell Media',
            url: 'https://checkmatemore.com/',
            logo: 'https://checkmatemore.com/assets/checkmatemore-icon-light.svg',
            email: 'hello@checkmatemore.com',
            contactPoint: [
              { '@type': 'ContactPoint', contactType: 'customer support', email: 'support@checkmatemore.com' },
              { '@type': 'ContactPoint', contactType: 'privacy', email: 'privacy@checkmatemore.com' }
            ]
          });
        }
        if (type === 'WebSite') {
          Object.assign(next, {
            '@id': 'https://checkmatemore.com/#website',
            name: 'CheckmateMore',
            alternateName: ['CheckmateMore Pro', 'Checkmate More'],
            url: 'https://checkmatemore.com/',
            publisher: { '@id': 'https://checkmatemore.com/#organization' }
          });
        }
        if ((type === 'Article' || type === 'BlogPosting') && next.author?.name === 'CheckmateMore editorial team') {
          next.author = { '@id': 'https://checkmatemore.com/#organization' };
        }
        return next;
      };
      return `${open}\n${JSON.stringify(visit(data), null, 2)}\n${close}`;
    } catch {
      return block;
    }
  });
}

function ensureSocialMetadata(html) {
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (!title || !description || !canonical) return html;
  const fields = [
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'CheckmateMore'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', canonical],
    ['property', 'og:image', 'https://checkmatemore.com/assets/social-card.svg'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', 'https://checkmatemore.com/assets/social-card.svg']
  ];
  const additions = fields
    .filter(([attribute, name]) => !new RegExp(`<meta ${attribute}="${name}"`, 'i').test(html))
    .map(([attribute, name, content]) => `  <meta ${attribute}="${name}" content="${content.replaceAll('"', '&quot;')}">`)
    .join('\n');
  return additions ? html.replace('</head>', `${additions}\n</head>`) : html;
}

const articleLinks = {
  '/how-it-works/': ['decision-dna-finding-the-choices-you-repeat-in-chess', 'how-to-build-a-chess-training-plan-from-your-own-games'],
  '/chess-game-analysis/': ['how-to-review-a-chess-game-without-chasing-accuracy', 'why-stockfish-alone-does-not-explain-a-human-chess-mistake'],
  '/weekly-chess-coaching/': ['what-repeated-chess-mistakes-are-trying-to-tell-you', 'how-to-build-a-chess-training-plan-from-your-own-games'],
  '/improvement-proof/': ['improvement-proof-how-to-tell-whether-training-is-changing-your-decisions', 'what-repeated-chess-mistakes-are-trying-to-tell-you'],
  '/chess-tactics-practice-from-your-games/': ['from-a-missed-tactic-to-a-useful-training-position', 'how-to-build-a-chess-training-plan-from-your-own-games'],
  '/play-chess-bots/': ['why-stockfish-alone-does-not-explain-a-human-chess-mistake', 'practical-chess-analysis-for-players-who-are-stuck'],
  '/pricing/': ['how-to-build-a-chess-training-plan-from-your-own-games', 'improvement-proof-how-to-tell-whether-training-is-changing-your-decisions'],
  '/guides/': ['how-to-review-a-chess-game-without-chasing-accuracy', 'practical-chess-analysis-for-players-who-are-stuck'],
  '/featured/': ['decision-dna-finding-the-choices-you-repeat-in-chess', 'what-repeated-chess-mistakes-are-trying-to-tell-you'],
  '/research/': ['why-stockfish-alone-does-not-explain-a-human-chess-mistake', 'improvement-proof-how-to-tell-whether-training-is-changing-your-decisions']
};
const articleNames = {
  'how-to-review-a-chess-game-without-chasing-accuracy': 'Review a game without chasing accuracy',
  'why-stockfish-alone-does-not-explain-a-human-chess-mistake': 'Why Stockfish alone does not explain a human mistake',
  'decision-dna-finding-the-choices-you-repeat-in-chess': 'Decision DNA and the choices you repeat',
  'how-to-build-a-chess-training-plan-from-your-own-games': 'Build a training plan from your own games',
  'what-repeated-chess-mistakes-are-trying-to-tell-you': 'What repeated chess mistakes tell you',
  'improvement-proof-how-to-tell-whether-training-is-changing-your-decisions': 'Check whether training is changing your decisions',
  'from-a-missed-tactic-to-a-useful-training-position': 'Turn a missed tactic into a training position',
  'practical-chess-analysis-for-players-who-are-stuck': 'Practical analysis for players who feel stuck'
};

function addRelatedReading(html, route, prefix) {
  const slugs = articleLinks[route];
  if (!slugs || html.includes('cm-blog-promo')) return html;
  const links = slugs.map(slug => `<a href="${prefix}blog/${slug}/">${articleNames[slug]}</a>`).join('');
  const section = `<section class="cm-section cm-tinted cm-blog-promo"><div class="cm-wrap"><p class="cm-kicker">From the CheckmateMore blog</p><h2>Read the ideas behind the feature.</h2><nav class="cm-related" aria-label="Related blog articles">${links}<a href="${prefix}blog/">Browse every article</a></nav></div></section>`;
  return html.replace(/(<section class="cm-final")/i, `${section}\n$1`);
}

for (const file of files) {
  const route = routeFor(file);
  const prefix = relativePrefix(route);
  let html = fs.readFileSync(file, 'utf8');
  html = addNavigation(html, prefix);
  html = addFooterLinks(html, prefix);
  html = improveStructuredData(html);
  html = ensureSocialMetadata(html);
  html = addRelatedReading(html, route, prefix);
  html = html.replace(/<div class="seo-author">\s*<i[^>]*><\/i>\s*By CheckmateMore editorial team\s*[·•]\s*Updated ([^<]+)<\/div>/gi, '<p class="seo-author">Updated $1</p>');
  html = html.replace(/initiate an eligible import/gi, 'import your games');
  fs.writeFileSync(file, html, 'utf8');
}

console.log(`Normalised public navigation, entity data and internal links across ${files.length} English pages.`);
