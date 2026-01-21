/* =========================================================
   ZEEDNA — Transliteration Guide (i18n)
   ========================================================= */

(function(){
  const LANG = getPreferredLang();

  const I18N = {
    fr: {
      g_beta: "Version bêta",
      g_title: "Guide de translittération (arabizi)",
      g_intro: "Sur Zeedna, tu verras parfois des mots écrits en lettres latines + chiffres (ex: 7, 3, 9). C’est une façon simple d’écrire l’arabe au clavier.",
      g_cta_search: "🔎 Commencer à chercher",
      g_cta_contrib: "➕ Ajouter un mot",
      g_table_title: "Correspondances rapides",
      g_col_1: "Translit",
      g_col_2: "Lettre arabe",
      g_col_3: "Exemple",
      g_examples_title: "Exemples",
      g_note: "Important : sans voyelles, plusieurs lectures sont possibles. La translittération est une aide (pratique), mais le mieux reste d’apprendre l’arabe."
    },
    en: {
      g_beta: "Beta version",
      g_title: "Transliteration guide (arabizi)",
      g_intro: "On Zeedna, you may see words written with Latin letters + numbers (e.g., 7, 3, 9). It's a simple way to type Arabic sounds.",
      g_cta_search: "🔎 Start searching",
      g_cta_contrib: "➕ Add a word",
      g_table_title: "Quick mapping",
      g_col_1: "Translit",
      g_col_2: "Arabic letter",
      g_col_3: "Example",
      g_examples_title: "Examples",
      g_note: "Important: without vowels, multiple readings are possible. Transliteration is a helpful guide, but learning Arabic is best."
    },
    ar: {
      g_beta: "نسخة تجريبية",
      g_title: "دليل الكتابة اللاتينية (Arabizi)",
      g_intro: "في Zeedna قد ترى كلمات بحروف لاتينية مع أرقام (مثل 7 و3 و9). هذه طريقة بسيطة لكتابة أصوات العربية على الكيبورد.",
      g_cta_search: "🔎 ابدأ البحث",
      g_cta_contrib: "➕ أضف كلمة",
      g_table_title: "مطابقة سريعة",
      g_col_1: "الرمز",
      g_col_2: "الحرف العربي",
      g_col_3: "مثال",
      g_examples_title: "أمثلة",
      g_note: "مهم: بدون الحركات قد توجد قراءات متعددة. هذه الكتابة مجرد مساعدة، والأفضل هو تعلّم العربية."
    }
  };

  function t(key){
    const pack = I18N[LANG] || I18N.en;
    return (pack[key] !== undefined) ? pack[key] : (I18N.fr[key] || "");
  }

  function applyI18n(){
    document.documentElement.lang = LANG;
    document.documentElement.dir = (LANG === "ar") ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if(!key) return;
      el.textContent = t(key);
    });
  }

  function buildTable(){
    const tbody = document.getElementById("mapTable");
    if(!tbody) return;

    const rows = [
      { tr: "3", ar: "ع", ex: "3lach / 3ib" },
      { tr: "7", ar: "ح", ex: "7iit / 7ob" },
      { tr: "5", ar: "خ", ex: "5ayr / 5dem" },
      { tr: "9", ar: "ق", ex: "9alab / 9add" },
      { tr: "2", ar: "ء", ex: "2ana / su2al" },
      { tr: "gh", ar: "غ", ex: "ghorba" },
      { tr: "ch", ar: "ش", ex: "ch7al" },
      { tr: "dh", ar: "ذ / ض / ظ", ex: "dhaher" },
      { tr: "th", ar: "ث", ex: "thnia" }
    ];

    tbody.innerHTML = rows.map(r => {
      return `
        <tr>
          <td><code>${escapeHtml(r.tr)}</code></td>
          <td><span dir="rtl" style="font-size:20px;">${escapeHtml(r.ar)}</span></td>
          <td class="muted">${escapeHtml(r.ex)}</td>
        </tr>
      `;
    }).join("");
  }

  // Theme toggle (reuse home logic)
  function applyTheme(mode){
    document.body.setAttribute("data-theme", mode);
    try{ localStorage.setItem("zeedna_theme", mode); }catch(e){}
  }

  function initThemeToggle(){
    const btn = document.getElementById("themeToggle");
    if(!btn) return;
    let saved = "dark";
    try{ saved = localStorage.getItem("zeedna_theme") || "dark"; }catch(e){}
    if(saved !== "light") saved = "dark";
    applyTheme(saved);
    btn.textContent = (saved === "light") ? "☀️" : "🌙";
    btn.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme") || "dark";
      const next = (current === "light") ? "dark" : "light";
      applyTheme(next);
      btn.textContent = (next === "light") ? "☀️" : "🌙";
    });
  }

  initThemeToggle();
  applyI18n();
  buildTable();
})();


// Lang switcher
document.addEventListener('DOMContentLoaded', () => {
  try { mountLangSwitcher(document.querySelector('.headerActions')); } catch(e) {}
});
