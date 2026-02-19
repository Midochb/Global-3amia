PATCH 73 - Insta word card global (effective)

Goal
- Make word pages (/mot/...) look "Instagrammable" in a minimal cultural style.
- Ensure the change is visible because word pages load the ROOT style.css (../style.css).

Files changed
- style.css
  Adds scoped styles applied only on word pages when body has: page-word + insta-word.
  Includes stronger glass card, better typography, and cultural accent glow.

- mot/mot.js
  Adds a small country theme mapping (flag + symbol + accent colors).
  Automatically sets body classes: page-word insta-word
  Updates the two hero badges (🌍 / ✨) to show the correct flag + cultural symbol.

How to apply
1) Replace your repo root style.css with this one
2) Replace mot/mot.js with this one
3) Commit + deploy Netlify

If you still see no change
- Hard refresh (Ctrl+F5) / clear cache
- Ensure Netlify deploy is done and you are on the new deploy URL
