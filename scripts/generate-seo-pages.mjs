import fs from "node:fs";
import path from "node:path";

// Netlify provides URL / DEPLOY_PRIME_URL in build env.
const SITE_URL = (process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/$/, "");

// Try to read API URL from existing JS so you don't have to update two places.
function detectApiUrl() {
  const candidates = [
    "recherche/app.js",
    "app.js",
    "mot/mot.js",
  ];
  for (const rel of candidates) {
    const p = path.join(process.cwd(), rel);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, "utf8");
    const m = txt.match(/https:\/\/script\.google\.com\/macros\/s\/[^\"'\s]+\/exec/g);
    if (m && m[0]) return m[0];
  }
  return null;
}

const API_URL = detectApiUrl();
if (!API_URL) {
  console.error("[SEO] Cannot detect API_URL. Make sure recherche/app.js contains the Apps Script URL.");
  process.exit(1);
}

const DIALECT = {
  TN: { fr: "tunisien", en: "Tunisian Arabic", ar: "تونسي" },
  MA: { fr: "darija marocaine", en: "Moroccan Darija", ar: "مغربي" },
  DZ: { fr: "algérien", en: "Algerian Arabic", ar: "جزائري" },
  LY: { fr: "libyen", en: "Libyan Arabic", ar: "ليبي" },
  EG: { fr: "égyptien", en: "Egyptian Arabic", ar: "مصري" },
  LB: { fr: "libanais", en: "Lebanese Arabic", ar: "لبناني" },
  SA: { fr: "saoudien", en: "Saudi Arabic", ar: "سعودي" },
  IQ: { fr: "irakien", en: "Iraqi Arabic", ar: "عراقي" },
  SD: { fr: "soudanais", en: "Sudanese Arabic", ar: "سوداني" },
};

// Grouping used by the SEO generator when it iterates over sheets like
// "Tounsi", "Maghribi", "Other dialect" etc.
function dialectGroupFromSheet(sheetName = "") {
  const s = String(sheetName).trim().toLowerCase();
  if (s.includes("tounsi")) return "tounsi";
  if (s.includes("maghribi")) return "maghribi";
  // default bucket for everything else (levantine, egyptian, khaleiji, etc.)
  return "other";
}

// Minimal lookup table expected by renderWordPage (DIALECTS[group]).
// Keep it small: it only impacts the SEO H1/title strings.
const DIALECTS = {
  tounsi: { fr: "tunisien", en: "Tunisian", ar: "تونسي" },
  maghribi: { fr: "maghrébin", en: "Maghrebi", ar: "مغاربي" },
  other: { fr: "dialectal", en: "Dialectal", ar: "عامي" },
};


function getCountryStyle(group){
  // Dialect/country visual identity for social-friendly pages
  // Feel free to tweak colors later; they only affect SEO/static pages.
  const styles = {
    tounsi:   { flag: '🇹🇳', icon: '🌶️', accent:'#ff4d4d', accent2:'#ffd166', wash:'rgba(255,77,77,.18)', wash2:'rgba(255,209,102,.12)' },
    maghribi: { flag: '🌍', icon: '🧿', accent:'#22c55e', accent2:'#60a5fa', wash:'rgba(34,197,94,.14)', wash2:'rgba(96,165,250,.10)' },
    other:    { flag: '🌍', icon: '✨', accent:'#7c3aed', accent2:'#06b6d4', wash:'rgba(124,58,237,.14)', wash2:'rgba(6,182,212,.10)' },
  };
  return styles[group] || styles.other;
}

function clean(v) {
  return (v === null || v === undefined) ? "" : String(v).trim();
}

function norm(s) {
  return clean(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(s) {
  return norm(s)
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(s) {
  return clean(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickRow(r) {
  // Support both the "clean" JSON export format and raw Excel headers (e.g. "Arabe", "Français").
  const mot_arabe = clean(r.mot_arabe || r.Arabe || r.arabe || r.word_ar || r.ar);
  const transliteration = clean(
    r.transliteration || r.phonetic || r.phonetique || r['Phonétique'] || r['Phonetique']
  );
  const fr = clean(
    r.sens_dialectal || r.sens_fr || r.traduction_fr || r.fr || r['Français'] || r['Francais']
  );
  const en = clean(r.traduction_eng || r.traduction_en || r.en || r['English'] || r['Anglais']);
  const nl = clean(r.traduction_nl || r.nl || r['Nederlands']);
  const fu = clean(r.Fouss7a || r.fouss7a || r.fu || r['Arabe classique']);
  const pays_code = clean(r.pays_code || r['pays_code'] || r['Pays'] || r['pays']).toUpperCase();
  const region = clean(r.region || r['Région'] || r['Region']);
  const exemple = clean(r.exemple_phrase || r.exemple_usage || r.exemple || r['Exemple']);
  const actif = clean(r.actif);
  const actifBool = actif === "" ? true : ["true","1","oui","vrai"].includes(norm(actif));

  return {
    mot_arabe,
    transliteration,
    fr,
    en,
    nl,
    fu,
    pays_code,
    region,
    exemple,
    actifBool,
  };
}

function makeFaqJsonLd(row, dialect, kind, pageUrl) {
  const qWord = kind === 'from_fr' ? (row.fr || row.Francais || row["Français"] || '') : (row.ar || row.Arabe || row["Arabe"] || '');
  const dialectLabel = dialect?.fr || dialect?.en || '';

  const question = qWord
    ? `Comment dire « ${qWord} » en ${dialectLabel} ?`
    : `Traduction en ${dialectLabel}`;

  const answerParts = [];
  const dialectWord = row.word || row.dialect || row.dialect_ar || row.MotDialecte || row["Mot (dialecte)"] || '';
  const phon = row.phon || row.phonetic || row["Phonétique"] || '';
  const fu = row.fusha || row.ar_classic || row["Arabe classique"] || '';
  const region = row.region || row["Région"] || '';

  if (dialectWord) answerParts.push(`Mot (dialecte) : ${dialectWord}`);
  if (phon) answerParts.push(`Phonétique : ${phon}`);
  if (fu) answerParts.push(`Arabe classique : ${fu}`);
  if (region) answerParts.push(`Région : ${region}`);

  const answer = answerParts.length
    ? answerParts.join(' • ')
    : `Traduction et usages du mot en ${dialectLabel}.`;

  const obj = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answer
        }
      }
    ]
  };
  if (pageUrl) obj.url = pageUrl;
  return obj;
}

function renderWordPage(row, group, kind) {
  const dialect = DIALECTS[group] || { fr: group, en: group, emoji: '🌍' };
  const country = getCountryStyle(group);

  const title = kind === 'from_fr'
    ? `« ${escapeHtml(row.fr)} » en ${escapeHtml(dialect.fr)}`
    : `« ${escapeHtml(row.ar)} » en ${escapeHtml(dialect.fr)}`;

  const subtitle = kind === 'from_fr'
    ? `Traduction et usage du mot « ${escapeHtml(row.fr)} » en ${escapeHtml(dialect.fr)}.`
    : `Traduction et usage du mot « ${escapeHtml(row.ar)} » en ${escapeHtml(dialect.fr)}.`;

  const faqObj = makeFaqJsonLd(row, dialect, kind);
  // Prevent "</script>" injection / stray text by escaping '<'
  const faqJson = JSON.stringify(faqObj).replace(/</g, '\\u003c');
  const faqScript = `<script type="application/ld+json">${faqJson}</script>`;

  const labelFr = row.fr ? escapeHtml(row.fr) : '';
  const labelAr = row.ar ? escapeHtml(row.ar) : '';
  const labelPh = row.phon ? escapeHtml(row.phon) : '';

  const badgeLeft = `${country.flag} ${escapeHtml(dialect.fr)}`;
  const badgeRight = country.icon;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | Zeedna</title>
  <meta name="description" content="${escapeHtml(subtitle)}" />
  <link rel="icon" href="/favicon.png" />
  <link rel="stylesheet" href="/style.css" />
  <meta property="og:title" content="${title} | Zeedna" />
  <meta property="og:description" content="${escapeHtml(subtitle)}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Zeedna" />
  <meta name="theme-color" content="${country.accent}" />
  ${faqScript}
  <style>
    :root{
      --country-accent:${country.accent};
      --country-accent-2:${country.accent2};
      --country-wash:${country.wash};
      --country-wash-2:${country.wash2};
    }
    body{ padding-top: 0; }
  </style>
</head>
<body class="word-page">
  <header class="header">
    <a class="brand" href="/" aria-label="Accueil">
      <span class="brand__logo">🏺</span>
      <span class="brand__text">Zeedna</span>
    </a>
    <nav class="header__nav">
      <a class="btn btn--ghost" href="/#search">Rechercher</a>
      <a class="btn" href="/add.html">+ Add your word</a>
    </nav>
  </header>

  <main class="container">
    <section class="word-hero">
      <div class="word-hero__badges">
        <span class="badge">${badgeLeft}</span>
        <span class="badge badge--icon" aria-hidden="true">${badgeRight}</span>
      </div>

      <h1 class="word-hero__title">${title}</h1>

      <div class="word-hero__cta">
        <a class="btn btn--ghost" href="/#search">Chercher un autre mot</a>
        <a class="btn" href="/add.html">Ajouter / corriger</a>
      </div>
    </section>

    <section class="word-grid">
      <article class="card card--word">
        <div class="card__label">Mot (français)</div>
        <div class="card__value card__value--fr">${labelFr || '—'}</div>
      </article>

      <article class="card card--word">
        <div class="card__label">Mot (dialecte)</div>
        <div class="card__value card__value--ar">${labelAr || '—'}</div>
        ${labelPh ? `<div class="card__sub">Phonétique : <b>${labelPh}</b></div>` : ''}
      </article>

      ${row.fusha ? `
      <article class="card card--word">
        <div class="card__label">Arabe classique</div>
        <div class="card__value card__value--ar">${escapeHtml(row.fusha)}</div>
      </article>
      ` : ''}

      ${row.reg ? `
      <article class="card card--word">
        <div class="card__label">Région</div>
        <div class="card__value">${escapeHtml(row.reg)}</div>
      </article>
      ` : ''}

      ${row.desc ? `
      <article class="card card--word card--wide">
        <div class="card__label">Note / contexte</div>
        <div class="card__value">${escapeHtml(row.desc)}</div>
      </article>
      ` : ''}
    </section>

    <section class="word-footer">
      <p>💡 Tu peux proposer une variante, une autre région, ou voter pour les meilleures contributions directement sur Zeedna.</p>
      <div class="word-footer__cta">
        <a class="btn btn--ghost" href="/#search">Retour au site</a>
        <a class="btn" href="/add.html">Contribuer</a>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <small>© ${new Date().getFullYear()} Zeedna</small>
    </div>
  </footer>
</body>
</html>`;
}

async function main() {
  console.log("[SEO] Fetching:", API_URL);
  const res = await fetch(API_URL + "?action=index&lang=fr", { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} from API. Body (first 300 chars): ${t.slice(0, 300)}`);
  }

  // Apps Script may return either an array (legacy) or an object wrapper like:
  // { ok:true, data:[...] } or { ok:true, items:[...] }
  const rawText = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    throw new Error(
      `API response is not valid JSON. First 300 chars: ${rawText.slice(0, 300)}`
    );
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : (parsed && (Array.isArray(parsed.data) ? parsed.data
      : Array.isArray(parsed.items) ? parsed.items
      : Array.isArray(parsed.rows) ? parsed.rows
      : null));

  if (!arr) {
    throw new Error(
      `API did not return an array. Got: ${JSON.stringify(parsed).slice(0, 600)}`
    );
  }

  const rows = arr.map(pickRow).filter(r => r.actifBool);
  console.log("[SEO] Entries:", rows.length);

  // Precompute paths
  for (const r of rows) {
    const base = slugify(r.mot_arabe) || slugify(r.transliteration) || "mot";
    const cc = (r.pays_code || "").toUpperCase() || "XX";
    r._motPath = `${base}--${cc}/index.html`;

    const q = slugify(r.fr || r.en || r.transliteration || r.mot_arabe || "mot");
    const d = DIALECTS[cc] || { fr: cc.toLowerCase() };
    const dSlug = slugify(d.fr || cc);
    r._cdPath = `${q}-en-${dSlug}/index.html`;
  }

  // Group by FR meaning (normalized)
  const groups = new Map();
  for (const r of rows) {
    const k = norm(r.fr || r.en || "");
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }
  for (const [k, arr] of groups) {
    // stable order
    arr.sort((a,b) => (a.pays_code || "").localeCompare(b.pays_code || ""));
  }

  // Output dirs
  const motDir = path.join(process.cwd(), "mot");
  const cdDir = path.join(process.cwd(), "comment-dire");
  fs.mkdirSync(motDir, { recursive: true });
  fs.mkdirSync(cdDir, { recursive: true });

  // Clean previous generated directories (safe: only subfolders containing "--")
  for (const base of [motDir, cdDir]) {
    if (!fs.existsSync(base)) continue;
    for (const name of fs.readdirSync(base)) {
      const full = path.join(base, name);
      if (!fs.statSync(full).isDirectory()) continue;
      // Keep the dynamic page folder "index.html" already exists in mot/; remove only generated dirs.
      if (base === motDir && name === "index.html") continue;
      // remove all dirs inside mot/ except existing files
    }
  }

  // Generate pages
  const urls = new Set();
  const addUrl = (u) => { if (u) urls.add(u); };

  for (const r of rows) {
    const g = groups.get(norm(r.fr || r.en || "")) || [];

    // /mot/<slug>--<CC>/index.html
    const outMotDir = path.join(process.cwd(), "mot", r._motPath.replace(/\/index\.html$/, ""));
    fs.mkdirSync(outMotDir, { recursive: true });
    fs.writeFileSync(path.join(outMotDir, "index.html"), renderWordPage(r, g, "mot"), "utf8");

    // /comment-dire/<...>/index.html
    const outCdDir = path.join(process.cwd(), "comment-dire", r._cdPath.replace(/\/index\.html$/, ""));
    fs.mkdirSync(outCdDir, { recursive: true });
    fs.writeFileSync(path.join(outCdDir, "index.html"), renderWordPage(r, g, "cd"), "utf8");

    addUrl(`/mot/${r._motPath}`);
    addUrl(`/comment-dire/${r._cdPath}`);
  }

  // robots + sitemap
  const staticUrls = [
    "/",
    "/recherche/",
    "/contribuer/",
  ];
  for (const u of staticUrls) addUrl(u);

  const sitemapEntries = Array.from(urls)
    .sort()
    .map((u) => {
      const loc = SITE_URL ? `${SITE_URL}${u.replace(/index\.html$/, "")}` : u.replace(/index\.html$/, "");
      return `  <url><loc>${loc}</loc></url>`;
    })
    .join("\n");

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`;

  fs.writeFileSync(path.join(process.cwd(), "sitemap.xml"), sitemapXml, "utf8");

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL ? SITE_URL : ""}/sitemap.xml\n`;
  fs.writeFileSync(path.join(process.cwd(), "robots.txt"), robots, "utf8");

  console.log("[SEO] Generated pages:", rows.length * 2);
  console.log("[SEO] sitemap.xml + robots.txt written");
}

main().catch((e) => {
  console.error("[SEO] Build failed:", e);
  process.exit(1);
});
