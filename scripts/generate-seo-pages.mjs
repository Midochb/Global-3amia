import fs from "node:fs";
import path from "node:path";

// Netlify provides URL / DEPLOY_PRIME_URL in build env.
const SITE_URL = (process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/$/, "");

// Try to read API URL from existing JS so you don't have to update two places.
function detectApiUrl() {
  const candidates = [
    "js/app.js",
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

// A translation can contain multiple equivalents (commas, slashes, parentheses...).
// To improve "other dialect" suggestions, we allow a row to belong to multiple
// meaning groups by splitting the translation into tokens.
function meaningKeys(meaning) {
  const raw = clean(meaning);
  if (!raw) return [];
  const stripped = raw
    .replace(/\([^)]*\)/g, " ") // remove parenthetical notes
    .replace(/\[[^\]]*\]/g, " ");

  const parts = stripped
    .split(/[,;\n\r\t\/|]+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const out = [];
  const seen = new Set();
  for (const p of parts) {
    const k = norm(p);
    if (!k || k.length < 2) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }

  // Fallback: if splitting removed everything, keep the whole thing.
  if (out.length === 0) {
    const k = norm(raw);
    if (k) out.push(k);
  }
  return out;
}

function normKey(k) {
  return clean(k)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getField(row, aliases) {
  if (!row) return "";
  // direct hit first
  for (const a of aliases) {
    if (a in row) return row[a];
  }
  // normalized key lookup
  const map = {};
  for (const k of Object.keys(row)) {
    map[normKey(k)] = row[k];
  }
  for (const a of aliases) {
    const v = map[normKey(a)];
    if (v !== undefined) return v;
  }
  return "";
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
  // NOTE: Apps Script may return raw column headers (e.g. "Français", "Arabe")
  // while the client code may use normalized keys (fr, mot_arabe, etc.).
  const mot_arabe = clean(getField(r, ["mot_arabe","arabe","Arabe","Arabe ","Mot (arabe)","mot (arabe)","ar","AR"]));
  const transliteration = clean(getField(r, [
    "transliteration","phonetic","phonetique","phonétique","Phonétique","Phonétique ","Phon",
  ]));
  // French concept/translation shown in the big header "Comment dire ..."
  // Depending on the sheet, this can be stored under different headers.
  // Many datasets (and older exports) store the FR meaning in `traduction`.
  const fr = clean(getField(r, [
    "Mot (français)","Mot (Francais)","mot_fr","mot_francais","francais","Français","Francais","fr","sens_dialectal","sens_fr","traduction_fr","traduction","label_fr","label",
  ]));
  const en = clean(getField(r, [
    "traduction_eng","traduction_en","en","anglais","Anglais","English","Description","description","label_en",
  ]));
  const nl = clean(getField(r, ["traduction_nl","nl","dutch","nederlands"]));
  const fu = clean(r.Fouss7a || r.fouss7a || r.fu);
  const pays_code = clean(r.pays_code).toUpperCase();
  const region = clean(r.region);
  const exemple = clean(r.exemple_phrase || r.exemple_usage || r.exemple);
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

function makeFaqJsonLd({ question, answer, url }) {
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
  // optional: attach url
  if (url) obj.url = url;
  return JSON.stringify(obj);
}

function renderWordPage(row, group, kind) {
  const d = DIALECT[row.pays_code] || { fr: row.pays_code || "dialecte", en: row.pays_code || "Dialect" };

  // Dictionary principle: the query term should be a *meaning* (FR/EN/NL)
  // and must NOT fall back to Arabic script in the visible H1.
  // If the French meaning is missing, we still show a clean H1 and clearly flag the missing translation.
  const qMeaning = (row.fr || row.en || row.nl || "").trim();
  // For meta/FAQ we can still use Arabic as a last resort (better for recall/search),
  // but we keep the visible H1 meaning-first.
  const qForMeta = (row.fr || row.en || row.nl || row.mot_arabe || "").trim();
  // For search links, prefer meaning, fallback to Arabic.
  const qForSearch = (qMeaning || row.mot_arabe || "").trim();
  const qFallback = kind === 'en' ? 'this word' : 'ce mot';
  const qDisplay = qMeaning || qFallback;

  const title = qDisplay
    ? `Comment dire ${qDisplay} en ${d.fr} ? — Zeedna 3amiat (bêta)`
    : `Mot en ${d.fr} — Zeedna 3amiat (bêta)`;

  const h1 = qDisplay
    ? `Comment dire ${escapeHtml(qDisplay)} en ${escapeHtml(d.fr)} ?`
    : `Traduction en ${escapeHtml(d.fr)}`;

  const descBits = [];
  if (row.mot_arabe) descBits.push(`Écriture arabe : ${row.mot_arabe}`);
  if (row.transliteration) descBits.push(`translittération : ${row.transliteration}`);
  if (row.region) descBits.push(`région : ${row.region}`);
  const description = qForMeta
    ? `Traduction de “${qForMeta}” en ${d.fr}. ${descBits.join(", ")}. Dictionnaire collaboratif des dialectes arabes (bêta).`
    : `Dictionnaire collaboratif des dialectes arabes (bêta). ${descBits.join(", ")}.`;

  const canonical = SITE_URL
    ? `${SITE_URL}${kind === "mot" ? "/mot/" : "/comment-dire/"}${kind === "mot" ? row._motPath : row._cdPath}`.replace(/\/index\.html$/, "")
    : null;

  const faqQ = qDisplay ? `Comment dire ${qDisplay} en ${d.fr} ?` : `Que veut dire ce mot en ${d.fr} ?`;
  const answerLines = [];
  if (row.mot_arabe) answerLines.push(`En ${d.fr}, on peut dire : ${row.mot_arabe}.`);
  if (row.transliteration) answerLines.push(`Translittération : ${row.transliteration}.`);
  if (row.en) answerLines.push(`EN : ${row.en}.`);
  if (row.nl) answerLines.push(`NL : ${row.nl}.`);
  if (row.fu) answerLines.push(`Arabe classique : ${row.fu}.`);
  const faqA = answerLines.join(" ");

  const jsonLd = makeFaqJsonLd({ question: faqQ, answer: faqA, url: canonical || undefined });

  const otherLinks = (group || [])
    .filter(x => x !== row)
    .slice(0, 10)
    .map(x => {
      const dd = DIALECT[x.pays_code] || { fr: x.pays_code || "dialecte" };
      const label = `Comment dire en ${dd.fr}`;
      return `<a class="pill" href="/comment-dire/${x._cdPath}">${escapeHtml(label)}</a>`;
    })
    .join("\n");

  const suggestMore = (group || [])
    .filter(x => x !== row)
    .slice(0, 6)
    .map(x => {
      const dd = DIALECT[x.pays_code] || { fr: x.pays_code || "dialecte" };
      return `
        <li>
          <a href="/mot/${x._motPath}">
            <span class="k">${escapeHtml(dd.fr)}</span>
            <span class="v" dir="rtl">${escapeHtml(x.mot_arabe || "—")}</span>
            <span class="t">${escapeHtml(x.transliteration || "")}</span>
          </a>
        </li>`;
    })
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <base href="/" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  ${canonical ? `<link rel="canonical" href="${canonical}" />` : ""}
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  ${canonical ? `<meta property="og:url" content="${canonical}" />` : ""}
  <script type="application/ld+json">${jsonLd}</script>
  <link rel="stylesheet" href="/style.css" />
  <style>
    .seo-wrap{max-width:920px;margin:0 auto;padding:18px}
    .seo-card{border:1px solid var(--border);background:var(--card);border-radius:16px;padding:18px}
    .seo-h1{font-size:28px;margin:0 0 10px;font-weight:900}
    .seo-kv{display:grid;grid-template-columns:140px 1fr;gap:10px 14px;margin-top:12px}
    .seo-kv .k{color:var(--muted);font-size:13px}
    .seo-kv .v{font-size:16px}
    .seo-kv .missing{color:var(--muted);font-style:italic}
    .seo-kv .v.seo-ar{font-size:clamp(40px,7vw,72px);line-height:1.05;font-weight:950}
    .seo-tr{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .seo-tr a{display:inline-flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:999px;border:1px solid var(--border);background:var(--card);text-decoration:none;font-size:12px;white-space:nowrap}
    .seo-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .pill{display:inline-flex;gap:8px;align-items:center;padding:8px 10px;border-radius:999px;border:1px solid var(--border);background:var(--card);text-decoration:none}
    .seo-suggest{margin-top:18px}
    .seo-suggest ul{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:10px}
    .seo-suggest li a{display:flex;gap:10px;align-items:center;justify-content:space-between;border:1px solid var(--border);background:var(--card);border-radius:14px;padding:12px 14px;text-decoration:none}
    .seo-suggest .k{color:var(--muted);min-width:120px}
    .seo-suggest .v{font-size:22px;font-weight:900}
    .seo-suggest .t{color:var(--muted)}
    .seo-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
    .seo-cta a{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:12px;border:1px solid var(--border);text-decoration:none}
    .seo-cta a.primary{background:var(--accent);color:var(--accentText);border-color:transparent}
  </style>
</head>
<body>
  <header class="topbar">
    <a class="iconBtn home-btn" href="/" aria-label="Accueil" title="Accueil">
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 10.5 12 3l9 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M5 10v10h14V10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9 20v-6h6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </a>
    <a class="brand brand-center" href="/recherche" aria-label="Recherche" title="Recherche">
      <img class="brandLogo brandLogo--lamp" src="/assets/LogoV2.png" alt="Zeedna" />
    </a>
    <a class="cta" href="/contribuer" data-i18n="add_word_btn">➕ Ajoute ton mot</a>
  </header>

  <main class="seo-wrap">
    <div class="seo-card">
      <h1 class="seo-h1">${escapeHtml(h1)}</h1>

      <div class="seo-cta">
        <a class="primary" href="/recherche/?q=${encodeURIComponent(qForSearch)}">Rechercher</a>
        <a href="/contribuer/?q=${encodeURIComponent(qForSearch)}">Ajouter / corriger</a>
      </div>

      <div class="seo-kv">
        <div class="k">Mot (arabe)</div>
        <div class="v seo-ar" dir="rtl">${escapeHtml(row.mot_arabe || "—")}</div>

        <div class="k">Phonétique</div>
        <div class="v seo-tr">
          <span>${escapeHtml(row.transliteration || "—")}</span>
          <a href="/transliteration/" title="Aide pour lire la phonétique">📖 Guide phonétique</a>
        </div>

        <div class="k" data-tr="fr">Mot (français)</div>
        <div class="v" data-tr="fr">${escapeHtml(row.fr || '—')}${row.fr ? '' : ' <span class="missing">(traduction manquante)</span>'}</div>

        ${row.en ? `<div class="k" data-tr="en">Meaning (English)</div><div class="v" data-tr="en">${escapeHtml(row.en)}</div>` : ""}
        ${row.fu ? `<div class="k">Arabe classique</div><div class="v" dir="rtl">${escapeHtml(row.fu)}</div>` : ""}
        ${row.region ? `<div class="k">Région</div><div class="v">${escapeHtml(row.region)}</div>` : ""}
      </div>

      ${row.exemple ? `
        <div style="margin-top:14px">
          <div class="small muted">Exemple</div>
          <div dir="rtl" style="font-size:20px;font-weight:800;margin-top:6px">${escapeHtml(row.exemple)}</div>
        </div>
      ` : ""}

      ${otherLinks ? `
        <div style="margin-top:16px" class="small muted">Autres dialectes</div>
        <div class="seo-pills">${otherLinks}</div>
      ` : ""}

      <div class="seo-suggest">
        <div class="small muted">Suggestions</div>
        <ul>${suggestMore}</ul>
      </div>
    </div>
  </main>
  <script>
    (function(){
      // Affiche uniquement la traduction correspondant à la langue du navigateur (FR/EN).
      // UI AR : on masque FR/EN et on conserve l'Arabe classique.
      var nav = (navigator.language || 'en').toLowerCase();
      var lang = nav.startsWith('fr') ? 'fr' : (nav.startsWith('ar') ? 'ar' : 'en');
      var i18n = {
        fr: { add_word_btn: '➕ Ajoute ton mot' },
        en: { add_word_btn: '➕ Add your word' },
        ar: { add_word_btn: '➕ أضف كلمتك' }
      };
      document.querySelectorAll('[data-i18n="add_word_btn"]').forEach(function(el){
        el.textContent = (i18n[lang] && i18n[lang].add_word_btn) ? i18n[lang].add_word_btn : i18n.en.add_word_btn;
      });

      var nodes = document.querySelectorAll('[data-tr]');
      nodes.forEach(function(el){
        el.style.display = (lang !== 'ar' && el.getAttribute('data-tr') === lang) ? '' : 'none';
      });
    })();
  </script>
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
    // use lowercase country suffix in SEO URLs: ...--ma/
    const cc = (r.pays_code || "").toLowerCase() || "xx";
    r._motPath = `${base}--${cc}/index.html`;

    const q = slugify(r.fr || r.en || r.transliteration || r.mot_arabe || "mot");
    const d = DIALECT[cc] || { fr: cc.toLowerCase() };
    const dSlug = slugify(d.fr || cc);
    r._cdPath = `${q}-en-${dSlug}/index.html`;
  }

  // Group by meaning keys (normalized). We allow one row to belong to multiple groups
  // (e.g. "aussi / également" -> keys: ["aussi", "egalement"]).
  const groups = new Map();
  for (const r of rows) {
    const keys = meaningKeys(r.fr || r.en || "");
    for (const k of keys) {
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
  }
  for (const [k, arr] of groups) {
    // de-duplicate (same row may be pushed multiple times if the translation repeats)
    const seen = new Set();
    const dedup = [];
    for (const r of arr) {
      const id = r.mot_id || `${r.mot_arabe}::${r.pays_code}`;
      if (seen.has(id)) continue;
      seen.add(id);
      dedup.push(r);
    }
    // stable order
    dedup.sort((a,b) => (a.pays_code || "").localeCompare(b.pays_code || "") || (a.mot_arabe || "").localeCompare(b.mot_arabe || ""));
    groups.set(k, dedup);
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
    const primaryKey = meaningKeys(r.fr || r.en || "")[0] || norm(r.fr || r.en || "");
    const g = groups.get(primaryKey) || [];

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
