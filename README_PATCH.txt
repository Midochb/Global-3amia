PATCH 69 — Fix missing translations on word pages

Symptom
- On /mot/<slug>/ pages, the French meaning was shown as “Traduction manquante” even though the dataset contains translations (and they appear in search).

Root cause
- Column names coming from Apps Script / exports vary (accents, casing, spaces, separators), so the word-page parser sometimes failed to pick the right “French” field.

What changed
- mot/mot.js
  - Added a resilient getField(...) that matches keys by a normalized form (no accents, trimmed, lowercase, separator-insensitive).
  - Expanded fallbacks for meaning fields:
    - French: Français/Francais/French/label_fr/label/…
    - English: Anglais/English/Description/label_en/label/…
  - Safety fallback kept: if only one translation exists, mirror it so the page never shows empty.

- scripts/generate-seo-pages.mjs
  - Same resilient getField(...) to ensure SEO-generated pages also get proper titles/meanings.

How to apply
- Replace your repo contents with this patch (upload & overwrite), or merge file-by-file.
- Redeploy on Netlify.
