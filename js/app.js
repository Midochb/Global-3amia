// =====================================================
// ZEEDNA 3AMIAT — BOOTSTRAP (Patch #90)
// Former monolithic app.js was split into:
// utils.js, synonyms.js, core.js, i18n.js, theme.js, router.js, ui-modal.js, ui-search.js
// =====================================================
(function(){
  const Z = window.Zeedna;
  if(!Z || !Z.searchUI) return;
  Z.searchUI.init();
})();
