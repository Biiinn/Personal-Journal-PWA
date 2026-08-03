// ============================================================
// I18N ENGINE — small, dependency-free translation system
// ============================================================
//
// How it works:
// - translations/en.js and translations/sv.js each attach a plain
//   nested object to window.TRANSLATIONS (e.g. TRANSLATIONS.en.write.saveButton).
// - t(key, params) looks up a dot-separated path in the current
//   language, falls back to English if missing, and finally falls
//   back to the last segment of the key itself (this matters for
//   user-typed custom category options, which have no translation —
//   see README for details).
// - Dynamic pieces of text (e.g. "{{count}} days") use {{placeholder}}
//   syntax, replaced via the params object.
// - Static HTML text is wired up declaratively with data-i18n
//   attributes instead of being hardcoded, so switching language
//   never requires touching markup.

let currentLanguage = 'en';

function detectDefaultLanguage() {
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return nav.startsWith('sv') ? 'sv' : 'en';
}

async function initI18n() {
  let saved = null;
  try {
    const res = await window.storage.get('app:language');
    saved = res ? res.value : null;
  } catch (e) { saved = null; }
  currentLanguage = saved || detectDefaultLanguage();
  document.documentElement.lang = currentLanguage;
  return currentLanguage;
}

function getLanguage() {
  return currentLanguage;
}

async function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'sv') return;
  currentLanguage = lang;
  document.documentElement.lang = lang;
  try { await window.storage.set('app:language', lang); } catch (e) { /* non-fatal */ }
  applyStaticTranslations();
  // Let the rest of the app know so it can re-render dynamic content
  // (chip labels, computed stats, etc.) without i18n.js needing to
  // know anything about the app's internal render functions.
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
}

function lookup(lang, key) {
  const dict = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || null;
  if (!dict) return undefined;
  let cur = dict;
  for (const part of key.split('.')) {
    if (cur == null || typeof cur !== 'object' || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, name) => (name in params ? params[name] : '{{' + name + '}}'));
}

// Look up a key in a SPECIFIC language (used by search, which checks
// both languages regardless of what's currently active).
function translate(lang, key, params) {
  const value = lookup(lang, key) ?? lookup('en', key);
  if (value === undefined) return key.split('.').pop();
  return interpolate(value, params);
}

// Look up a key in the CURRENT language.
function t(key, params) {
  return translate(currentLanguage, key, params);
}

// Scan the DOM for elements carrying data-i18n* attributes and fill
// them in. Called once at startup and again whenever the language changes.
function applyStaticTranslations(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
  scope.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.getAttribute('data-i18n-title')); });
  scope.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
}
