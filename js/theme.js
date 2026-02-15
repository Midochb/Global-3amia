/* =========================================================
   ZEEDNA 3AMIAT — THEME
   ========================================================= */
(function(){
  window.Zeedna = window.Zeedna || {};
  const Z = window.Zeedna;

  function applyTheme(mode){
    document.body.dataset.theme = mode;
    try{ localStorage.setItem("zeedna_theme", mode); }catch(e){}
  }

  function initThemeToggle(){
    const btn = document.getElementById("themeToggle");
    const saved = (()=>{ try{ return localStorage.getItem("zeedna_theme"); }catch(e){ return null; }})();
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "dark")); // keep legacy: default dark
    if(!btn) return;

    btn.addEventListener("click", ()=>{
      const cur = document.body.dataset.theme || "dark";
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }

  Z.theme = { applyTheme, initThemeToggle };
})();
