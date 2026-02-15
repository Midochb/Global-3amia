PATCH #90 — Refacto + code plus clean (sans changer le comportement)

Objectif
- Découper l'ancien /js/app.js (monolithique) en modules plus lisibles
- Garder un site 100% static (pas de framework) compatible GitHub → Netlify

Changements clés
- /js/app.js : devient un simple bootstrap (init)
- Nouveaux fichiers:
  - /js/i18n.js      : traductions UI (I18N, t(), applyI18nStatic, getMeaningForLang)
  - /js/core.js      : API + cache localStorage + normalizeRow() + loadData()
  - /js/theme.js     : thème light/dark
  - /js/router.js    : hash routing (#mot=...) + URL params (?q=...&dialect=...)
  - /js/ui-modal.js  : modal + affichage des synonymes
  - /js/ui-search.js : recherche + suggestions + filtres + rendu liste

- /recherche/index.html : scripts re-ordonnés (ordre important)

Notes
- Aucun changement de design demandé dans ce patch
- Cache : 6h (par langue UI)
