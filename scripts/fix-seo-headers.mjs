import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIRS = ['mot', 'comment-dire'];
const ROOT = process.cwd();

function walk(dir){
  const out=[];
  if(!fs.existsSync(dir)) return out;
  const entries=fs.readdirSync(dir, {withFileTypes:true});
  for(const e of entries){
    const p=path.join(dir, e.name);
    if(e.isDirectory()) out.push(...walk(p));
    else if(e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function replaceTopbar(html){
  // Replace legacy brand block (logo+text) by centered lamp-only logo.
  // Works for multiple historical variants.
  const topbarRe = /<header class="topbar">[\s\S]*?<\/header>/m;
  const m = html.match(topbarRe);
  if(!m) return html;

  let topbar = m[0];

  // Ensure logo path is the search logo
  // Force the same logo as the Search page
  topbar = topbar.replaceAll('/assets/logo_search.png','/assets/LogoV2.png');
  topbar = topbar.replaceAll('/assets/logo_icon.png','/assets/LogoV2.png');

  // If we still have a <div class="brand" ...> legacy block, replace it.
  const legacyBrandRe = /<div class="brand"[^>]*>[\s\S]*?<\/div>\s*(?=<a class="cta"|<button|<a class="cta")/m;
  if(legacyBrandRe.test(topbar)){
    topbar = topbar.replace(legacyBrandRe,
`<a class="brand brand-center" href="/recherche" aria-label="Recherche" title="Recherche">
      <img class="brandLogo brandLogo--lamp" src="/assets/LogoV2.png" alt="Zeedna" />
    </a>
    `);
  }

  // If a brand-center exists but points to the wrong image, fix it.
  topbar = topbar.replace(/(<img[^>]+class="[^"]*brandLogo[^\"]*"[^>]+src=")([^"]+)("[^>]*>)/g,
    (_,a,_src,c)=>`${a}/assets/LogoV2.png${c}`);

  return html.replace(topbarRe, topbar);
}

let changed = 0;
for(const d of TARGET_DIRS){
  const abs = path.join(ROOT, d);
  for(const f of walk(abs)){
    const before = fs.readFileSync(f, 'utf8');
    let after = before;
    after = replaceTopbar(after);
    if(after !== before){
      fs.writeFileSync(f, after, 'utf8');
      changed++;
    }
  }
}

console.log(`[SEO] fix-seo-headers: updated ${changed} file(s)`);
