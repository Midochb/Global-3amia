PATCH 69

Fix: translations shown as 'Traduction manquante' on word pages

- Added robust key-alias resolver (case/accents/spaces/separators) in mot/mot.js
- Added broader fallbacks for French/English meaning fields (Français/Francais/label/Description etc.)
- Kept behavior: if only one translation exists, it is mirrored to avoid empty display
- Applied same resilient field resolver in scripts/generate-seo-pages.mjs for SEO pages

How to apply
1) Replace the files from this zip into your repo (keep the rest)
2) Commit + push, Netlify will rebuild
3) Hard refresh (mobile: clear cache or reload twice)
