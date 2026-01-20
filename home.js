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
    home_title: 'Dictionnaire collaboratif des dialectes arabes',
    home_subtitle: 'Version bêta. Compare darija, tunisien, algérien, égyptien, levantin, khaliji… reliés à l’arabe classique et aux langues européennes.',
    home_cta_search: 'Commence à chercher',
    home_cta_contribute: 'Ajoute ton mot',
    home_tr_help_link: 'Comment lire la translittération ?',
    home_note: 'Idée de départ: faciliter la compréhension du monde arabe, surtout pour celles et ceux nés à l\'extérieur qui veulent (re)découvrir leurs racines et les bases de l’arabe classique.',
    home_how_title: 'Comment ça marche',
    home_step1_title: 'Cherche un mot',
    home_step1_desc: 'Écris en arabe, en translit, ou en FR/EN/NL/DE. Tu vois des suggestions au fur et à mesure.',
    home_step2_title: 'Compare les variantes',
    home_step2_desc: 'Filtre par pays, ouvre une fiche, et découvre les synonymes proches.',
    home_step3_title: 'Ajoute une contribution',
    home_step3_desc: 'Si le mot n\'existe pas, propose-le. C\'est communautaire: chacun ajoute ses variantes régionales.',
    home_why_title: 'Pourquoi Zeedna 3amiat',
    home_why_1: 'Un seul endroit pour les dialectes (et leurs variantes régionales).',
    home_why_2: 'Des traductions reliées au FR/EN/NL/DE + exemples d\'usage.',
    home_why_3: 'Un projet vivant: tu contribues et la base s\'enrichit.',
    home_footer_search: 'Recherche',
    home_footer_contribute: 'Ajoute ton mot'
  },
  en: {
    home_title: 'Community Arabic dialect dictionary',
    home_subtitle: 'Beta. Compare Darija, Tunisian, Algerian, Egyptian, Levantine, Gulf… linked to Classical Arabic and European languages.',
    home_cta_search: 'Start searching',
    home_cta_contribute: 'Add your word',
    home_tr_help_link: 'How to read transliteration?',
    home_note: 'Starting point: make Arabic dialect understanding easier, especially for people born abroad who want to reconnect with their roots and learn the basics of Classical Arabic.',
    home_how_title: 'How it works',
    home_step1_title: 'Search a word',
    home_step1_desc: 'Type Arabic, transliteration, or FR/EN/NL/DE. Suggestions appear as you type.',
    home_step2_title: 'Compare variants',
    home_step2_desc: 'Filter by country, open an entry, and discover close synonyms.',
    home_step3_title: 'Add a contribution',
    home_step3_desc: 'If a word is missing, submit it. It\'s community-driven: add regional variants too.',
    home_why_title: 'Why Zeedna 3amiat',
    home_why_1: 'One place for dialects (including regional variants).',
    home_why_2: 'Translations linked to FR/EN/NL/DE + usage examples.',
    home_why_3: 'A living project: you contribute and the database grows.',
    home_footer_search: 'Search',
    home_footer_contribute: 'Add your word'
  },
  ar: {
    home_title: 'قاموس مجتمعي للهجات العربية',
    home_subtitle: 'نسخة تجريبية (بيتا). قارن الدارجة والتونسي والجزائري والمصري والشامي والخليجي… مع ربطها بالعربية الكلاسيكية وباللغات الأوروبية.',
    home_cta_search: 'ابدأ البحث',
    home_cta_contribute: 'أضف كلمتك',
    home_tr_help_link: 'كيف نقرأ النقل الصوتي؟',
    home_note: 'الفكرة: تسهيل فهم اللهجات العربية، خصوصاً لمن وُلدوا خارج الوطن ويريدون العودة للجذور وتعلّم أساسيات العربية الكلاسيكية.',
    home_how_title: 'كيف يعمل',
    home_step1_title: 'ابحث عن كلمة',
    home_step1_desc: 'اكتب بالعربية أو باللاتينية أو FR/EN/NL/DE وستظهر اقتراحات أثناء الكتابة.',
    home_step2_title: 'قارن الاختلافات',
    home_step2_desc: 'صفِّ حسب البلد، افتح البطاقة، واكتشف مرادفات قريبة.',
    home_step3_title: 'أضف مساهمة',
    home_step3_desc: 'إذا لم تكن الكلمة موجودة، اقترحها. المشروع مجتمعي: أضف حتى الاختلافات المناطقية.',
    home_why_title: 'لماذا Zeedna 3amiat',
    home_why_1: 'مكان واحد للهجات (مع الاختلافات المناطقية).',
    home_why_2: 'ترجمات مرتبطة بـ FR/EN/NL/DE + أمثلة استعمال.',
    home_why_3: 'مشروع حي: مساهمتك تُنمّي القاعدة.',
    home_footer_search: 'بحث',
    home_footer_contribute: 'أضف كلمتك'
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
