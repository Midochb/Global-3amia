/* =========================================================
   HOME i18n + THEME
   ========================================================= */

function detectLang(){
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('fr')) return 'fr';
  return 'en';
}

const LANG = detectLang();

const I18N_HOME = {
  fr: {
    home_title: 'Le dico participatif des dialectes arabes',
    home_subtitle: 'Darija, tunisien, algérien, égyptien, levantin, khaliji… Tout au même endroit.',
    home_cta_search: 'Commence à chercher',
    home_cta_contribute: 'Contribuer',
    home_note: 'Objectif: comparer les mots entre pays, comprendre l\'usage, et construire une base fiable avec la communauté.',
    home_how_title: 'Comment ça marche',
    home_step1_title: 'Cherche un mot',
    home_step1_desc: 'Écris en arabe, en translit, ou en français. Tu vois des suggestions au fur et à mesure.',
    home_step2_title: 'Compare les variantes',
    home_step2_desc: 'Filtre par pays, ouvre une fiche, et découvre les synonymes proches.',
    home_step3_title: 'Ajoute une contribution',
    home_step3_desc: 'Si le mot n\'existe pas, propose-le. On garde une trace (log) pour éviter les pertes.',
    home_why_title: 'Pourquoi Zeedna 3amiat',
    home_why_1: 'Un seul endroit pour les dialectes: pas 10 glossaires éclatés.',
    home_why_2: 'Des exemples d\'usage pour comprendre le contexte.',
    home_why_3: 'Un modèle communautaire: tu contribues, tu améliores la qualité.',
    home_footer_search: 'Recherche',
    home_footer_contribute: 'Contribuer'
  },
  en: {
    home_title: 'The community Arabic dialect dictionary',
    home_subtitle: 'Darija, Tunisian, Algerian, Egyptian, Levantine, Gulf… all in one place.',
    home_cta_search: 'Start searching',
    home_cta_contribute: 'Contribute',
    home_note: 'Goal: compare words across countries, understand usage, and build a reliable database with the community.',
    home_how_title: 'How it works',
    home_step1_title: 'Search a word',
    home_step1_desc: 'Type Arabic, transliteration, or French. Suggestions appear as you type.',
    home_step2_title: 'Compare variants',
    home_step2_desc: 'Filter by country, open an entry, and discover close synonyms.',
    home_step3_title: 'Add a contribution',
    home_step3_desc: 'If a word is missing, submit it. We keep a log to reduce lost submissions.',
    home_why_title: 'Why Zeedna 3amiat',
    home_why_1: 'One place for dialects instead of scattered glossaries.',
    home_why_2: 'Usage examples to understand context.',
    home_why_3: 'Community-driven: you contribute and improve quality.',
    home_footer_search: 'Search',
    home_footer_contribute: 'Contribute'
  },
  ar: {
    home_title: 'قاموس مجتمعي للهجات العربية',
    home_subtitle: 'الدارجة، التونسي، الجزائري، المصري، الشامي، الخليجي… كله في مكان واحد.',
    home_cta_search: 'ابدأ البحث',
    home_cta_contribute: 'ساهم',
    home_note: 'الهدف: مقارنة الكلمات بين البلدان، وفهم الاستعمال، وبناء قاعدة موثوقة مع المجتمع.',
    home_how_title: 'كيف يعمل',
    home_step1_title: 'ابحث عن كلمة',
    home_step1_desc: 'اكتب بالعربية أو باللاتينية أو بالفرنسية وستظهر اقتراحات أثناء الكتابة.',
    home_step2_title: 'قارن الاختلافات',
    home_step2_desc: 'صفِّ حسب البلد، افتح البطاقة، واكتشف مرادفات قريبة.',
    home_step3_title: 'أضف مساهمة',
    home_step3_desc: 'إذا لم تكن الكلمة موجودة، اقترحها. نحتفظ بسجل لتقليل ضياع الإرسال.',
    home_why_title: 'لماذا Zeedna 3amiat',
    home_why_1: 'مكان واحد للهجات بدل قوائم متفرقة.',
    home_why_2: 'أمثلة استعمال لفهم السياق.',
    home_why_3: 'مشروع مجتمعي: مساهمتك ترفع الجودة.',
    home_footer_search: 'بحث',
    home_footer_contribute: 'ساهم'
  }
};

function t(key){
  const pack = I18N_HOME[LANG] || I18N_HOME.en;
  const fr = I18N_HOME.fr;
  return (pack[key] ?? fr[key] ?? '');
}

function applyHomeI18n(){
  document.documentElement.lang = LANG;
  document.documentElement.dir = (LANG === 'ar') ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(!key) return;
    const val = t(key);
    if(val) el.textContent = val;
  });
}

// Theme toggle (same behavior as other pages)
function applyTheme(mode){
  document.body.setAttribute('data-theme', mode);
  try { localStorage.setItem('zeedna_theme', mode); } catch(e){}
}

function initThemeToggle(){
  const btn = document.getElementById('themeToggle');
  if(!btn) return;

  let saved = 'dark';
  try { saved = localStorage.getItem('zeedna_theme') || 'dark'; } catch(e){}
  if(saved !== 'light') saved = 'dark';

  applyTheme(saved);
  btn.textContent = (saved === 'light') ? '☀️' : '🌙';

  btn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = (current === 'light') ? 'dark' : 'light';
    applyTheme(next);
    btn.textContent = (next === 'light') ? '☀️' : '🌙';
  });
}

applyHomeI18n();
initThemeToggle();
