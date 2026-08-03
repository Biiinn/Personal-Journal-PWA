const MOODS = [
  { id: 'great', emoji: '😄', color: '#E3A857' },
  { id: 'good', emoji: '🙂', color: '#7FA98C' },
  { id: 'okay', emoji: '😐', color: '#9891B0' },
  { id: 'bad', emoji: '🙁', color: '#8B6F9E' },
  { id: 'awful', emoji: '😢', color: '#C1666B' },
];

const CATS = {
  feelings: { multi: true, opts: [['grateful','🙏'],['satisfied','😌'],['thrilled','🤩'],['stressed','😖'],['tired','🥱'],['anxious','😟'],['calm','😇'],['motivated','🔥'],['sad','😔'],['angry','😠'],['inLove','🥰'],['lonely','🥺'],['inspired','💡'],['overwhelmed','🤯'],['secure','🛡️']] },
  sleep: { multi: false, opts: [['good','😴'],['average','🙂'],['poor','😩']] },
  energy: { multi: false, opts: [['low','🪫'],['medium','🔋'],['high','⚡']] },
  health: { multi: true, opts: [['gym','🏋️'],['running','🏃'],['walking','🚶'],['yoga','🧘'],['swimming','🏊'],['cycling','🚴'],['stretching','🤸'],['noExercise','🛌']] },
  hobbies: { multi: true, opts: [['skateboarding','🛹'],['chess','♟️'],['coding','💻'],['reading','📖'],['gaming','🎮'],['drawing','🎨'],['music','🎵'],['instrument','🎸'],['moviesShows','🎬'],['photography','📷']] },
  food: { multi: true, opts: [['homemade','🍳'],['fastFood','🍔'],['restaurant','🍽️'],['delivery','🛵'],['noSoda','🚫'],['lotsOfWater','💧'],['skippedMeal','⏭️'],['baking','🧁']] },
  social: { multi: true, opts: [['family','👨‍👩‍👧'],['friends','👯'],['party','🎉'],['club','🪩'],['date','💕'],['alone','🧍'],['coworkers','💼'],['newPeople','🤝']] },
  self: { multi: true, opts: [['meditation','🧘‍♂️'],['donated','💸'],['kindness','💛'],['readEducational','📚'],['journaling','✍️'],['gratitudePractice','🙏'],['helpedSomeone','🤲'],['reflected','🪞']] },
  chores: { multi: true, opts: [['laundry','🧺'],['cleaning','🧹'],['groceryShopping','🛒'],['dishes','🍽️'],['shopping','🛍️'],['paidBills','💳'],['organizing','🗂️']] },
  weather: { multi: false, opts: [['sunny','☀️'],['cloudy','☁️'],['rainy','🌧️'],['snowy','❄️'],['windy','💨'],['foggy','🌫️']] },
  beauty: { multi: true, opts: [['haircut','💇'],['spa','🧖'],['facial','🧴'],['manicure','💅'],['newOutfit','👗'],['skincare','✨']] },
  relations: { multi: true, opts: [['family','👨‍👩‍👧'],['partner','💑'],['friends','👯'],['coworkers','💼'],['alone','🧍']] },
  places: { multi: true, opts: [['home','🏠'],['work','🏢'],['gym','🏋️'],['cafe','☕'],['vacation','🏖️'],['travel','✈️']] },
};
const ELID = { feelings:'feelingsChips', sleep:'sleepChips', energy:'energyChips', health:'healthChips', hobbies:'hobbyChips', food:'foodChips', social:'socialChips', self:'selfChips', chores:'choreChips', weather:'weatherChips', beauty:'beautyChips', relations:'relationsChips', places:'placesChips' };

let customOptions = {};
let addingCat = null;
let state = emptyEntry();
let currentDate = todayStr();
let calViewDate = new Date();

function emptyEntry() {
  return { mood: null, feelings: [], sleep: null, energy: null, health: [], hobbies: [], food: [], social: [], self: [], chores: [], weather: null, beauty: [], relations: [], places: [],
    notes: '', photos: [], steps: null, gratitude: ['','',''], highlight: '', lowlight: '', tomorrowFocus: '', screenTime: null, moneySpent: null, favorite: false };
}
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function localeTag() {
  return getLanguage() === 'sv' ? 'sv-SE' : 'en-US';
}
function fmtTitle(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  let s = d.toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatNumber(n) {
  return n.toLocaleString(localeTag());
}
function addDaysStr(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function dataURLToBlob(dataURL) {
  const [header, base64] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// ---------- LOCK SCREEN (code is chosen by the user, saved in storage) ----------
const lockBox = document.getElementById('lockBox');

async function getSavedPin() {
  try {
    const res = await window.storage.get('journal:pin');
    return res ? res.value : null;
  } catch (e) { return null; }
}

async function initLock() {
  const savedPin = await getSavedPin();
  if (!savedPin) renderOnboarding(lockBox, unlockApp);
  else renderUnlockScreen(savedPin);
}

function renderUnlockScreen(savedPin) {
  lockBox.innerHTML = `
    <div class="icon">🔒</div>
    <h2>${t('lock.locked')}</h2>
    <input type="password" id="pinInput" placeholder="${t('lock.code')}">
    <div class="err" id="pinErr"></div>
  `;
  const pinInput = document.getElementById('pinInput');
  const pinErr = document.getElementById('pinErr');
  const tryUnlock = () => {
    if (pinInput.value === savedPin) unlockApp();
    else { pinErr.textContent = t('lock.wrongCode'); pinInput.value = ''; }
  };
  pinInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
  setTimeout(() => pinInput.focus(), 200);
}

function unlockApp() {
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('appRoot').style.display = 'block';
  applyStaticTranslations();
  initApp();
}

async function startApp() {
  await initI18n();
  applyStaticTranslations();
  await initLock();
}
startApp();

// Re-render everything that shows translated text when the language changes.
document.addEventListener('languagechange', () => {
  applyStaticTranslations();
  renderMood();
  renderFavToggle();
  renderAllChips();
  updateWordMeter();
  const activeView = document.querySelector('.view.active');
  if (!activeView) return;
  const id = activeView.id.replace('view', '').toLowerCase();
  if (id === 'home') renderHome();
  if (id === 'calendar') renderCalendar();
  if (id === 'stats') { renderStats(); renderPinChangeArea(); renderLanguageSwitcher(); }
  if (id === 'life') renderLife();
  if (id === 'wrapped') renderWrapped();
});

// ---------- CUSTOM OPTIONS ----------
async function loadCustomOptions() {
  try {
    const res = await window.storage.get('journal:customOptions');
    customOptions = res ? JSON.parse(res.value) : {};
  } catch (e) { customOptions = {}; }
}
function allOptsFor(cat) {
  const base = CATS[cat].opts.map(o => o[0]);
  const extra = (customOptions[cat] || []);
  const merged = [...CATS[cat].opts];
  extra.forEach(name => { if (!base.includes(name)) merged.push([name, '✨']); });
  return merged;
}
function emojiFor(cat, name) {
  const found = CATS[cat].opts.find(o => o[0] === name);
  return found ? found[1] : '✨';
}
// Built-in option values are translation keys (e.g. "grateful"); custom
// user-typed values have no translation, so t() falls back to the raw text.
function displayLabel(cat, value) {
  return t('categories.' + cat + '.' + value);
}

function renderMood() {
  const grid = document.getElementById('moodGrid');
  grid.innerHTML = '';
  MOODS.forEach(m => {
    const btn = document.createElement('div');
    btn.className = 'mood-btn' + (state.mood === m.id ? ' selected' : '');
    if (state.mood === m.id) { btn.style.borderColor = m.color; btn.style.background = m.color + '22'; }
    btn.innerHTML = '<span class="emoji">' + m.emoji + '</span>' + t('mood.' + m.id);
    btn.onclick = () => { state.mood = m.id; renderMood(); scheduleAutosave(); };
    grid.appendChild(btn);
  });
}

function renderChipGroup(cat) {
  const el = document.getElementById(ELID[cat]);
  el.innerHTML = '';
  const multi = CATS[cat].multi;
  const customList = customOptions[cat] || [];
  allOptsFor(cat).forEach(([name, emoji]) => {
    const chip = document.createElement('div');
    const isSelected = multi ? state[cat].includes(name) : state[cat] === name;
    const isCustom = customList.includes(name);
    chip.className = 'chip' + (isSelected ? ' selected' : '');
    chip.innerHTML = emoji + ' ' + (isCustom ? name : t('categories.' + cat + '.' + name));
    chip.onclick = () => {
      if (multi) {
        const idx = state[cat].indexOf(name);
        if (idx > -1) state[cat].splice(idx, 1); else state[cat].push(name);
      } else {
        state[cat] = state[cat] === name ? null : name;
      }
      renderChipGroup(cat);
      scheduleAutosave();
    };
    if (isCustom) {
      const del = document.createElement('span');
      del.className = 'chip-del';
      del.textContent = '×';
      del.title = t('common.removeCustomOption');
      del.onclick = async (e) => {
        e.stopPropagation();
        customOptions[cat] = customOptions[cat].filter(o => o !== name);
        await window.storage.set('journal:customOptions', JSON.stringify(customOptions));
        if (multi) { const idx = state[cat].indexOf(name); if (idx > -1) state[cat].splice(idx, 1); }
        else if (state[cat] === name) state[cat] = null;
        renderChipGroup(cat);
        scheduleAutosave();
      };
      chip.appendChild(del);
    }
    el.appendChild(chip);
  });

  if (addingCat === cat) {
    const inputWrap = document.createElement('div');
    inputWrap.style.cssText = 'display:flex;gap:6px;align-items:center;';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = t('common.typeAndEnter');
    input.style.cssText = 'background:var(--surface-2);border:1px solid var(--amber);color:var(--text);border-radius:20px;padding:8px 14px;font-size:13.5px;font-family:Inter,sans-serif;outline:none;width:160px;';
    let committed = false;
    const commit = async () => {
      if (committed) return;
      committed = true;
      const val = input.value.trim();
      addingCat = null;
      if (val) {
        if (!customOptions[cat]) customOptions[cat] = [];
        if (!customOptions[cat].includes(val) && !CATS[cat].opts.some(o => o[0] === val)) {
          customOptions[cat].push(val);
          await window.storage.set('journal:customOptions', JSON.stringify(customOptions));
        }
        if (multi) state[cat].push(val); else state[cat] = val;
        scheduleAutosave();
      }
      renderChipGroup(cat);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') { committed = true; addingCat = null; renderChipGroup(cat); }
    });
    input.addEventListener('blur', commit);
    inputWrap.appendChild(input);
    el.appendChild(inputWrap);
    setTimeout(() => input.focus(), 0);
  } else {
    const addChip = document.createElement('div');
    addChip.className = 'chip add-chip';
    addChip.textContent = t('common.addCustom');
    addChip.onclick = () => { addingCat = cat; renderChipGroup(cat); };
    el.appendChild(addChip);
  }
}
function renderAllChips() { Object.keys(CATS).forEach(renderChipGroup); }

// Photo gallery logic (multiple photos per entry) lives in
// components/gallery.js — see renderGallery(), handlePhotoFilesSelected(),
// and the lightbox functions there.

// ---------- NOTES / WORD METER / EXTRA FIELDS ----------
function updateWordMeter() {
  const text = document.getElementById('notes').value.trim();
  const words = text.length ? text.split(/\s+/).filter(Boolean).length : 0;
  document.getElementById('wordCount').textContent = t('common.wordsCount', { count: words });
  document.getElementById('wordFill').style.width = Math.min(100, (words / 1000) * 100) + '%';
}
document.getElementById('notes').addEventListener('input', (e) => { state.notes = e.target.value; updateWordMeter(); scheduleAutosave(); });
document.getElementById('stepsInput').addEventListener('input', (e) => { state.steps = e.target.value ? parseInt(e.target.value) : null; scheduleAutosave(); });
document.getElementById('screenTimeInput').addEventListener('input', (e) => { state.screenTime = e.target.value ? parseFloat(e.target.value) : null; scheduleAutosave(); });
document.getElementById('moneyInput').addEventListener('input', (e) => { state.moneySpent = e.target.value ? parseFloat(e.target.value) : null; scheduleAutosave(); });
document.getElementById('highlightInput').addEventListener('input', (e) => { state.highlight = e.target.value; scheduleAutosave(); });
document.getElementById('lowlightInput').addEventListener('input', (e) => { state.lowlight = e.target.value; scheduleAutosave(); });
document.getElementById('tomorrowInput').addEventListener('input', (e) => { state.tomorrowFocus = e.target.value; scheduleAutosave(); });
document.getElementById('favToggleBtn').addEventListener('click', () => {
  state.favorite = !state.favorite;
  renderFavToggle();
  scheduleAutosave();
});
function renderFavToggle() {
  const btn = document.getElementById('favToggleBtn');
  btn.textContent = state.favorite ? '⭐' : '☆';
  btn.classList.toggle('active', !!state.favorite);
}
['grat0','grat1','grat2'].forEach((id, i) => {
  document.getElementById(id).addEventListener('input', (e) => { state.gratitude[i] = e.target.value; scheduleAutosave(); });
});

// ---------- AUTOSAVE ----------
// Fires 2 seconds after the last change. Force-flushed immediately
// (no waiting for the debounce) whenever the user leaves the Write tab,
// switches to a different date, or closes the page — so nothing typed
// is ever lost sitting in the debounce window.
let autosaveTimer = null;
let autosaveDirty = false;
let autosavePendingDate = null; // which date the pending change belongs to

function scheduleAutosave() {
  autosaveDirty = true;
  autosavePendingDate = currentDate;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { flushAutosave(); }, 2000);
}

// Used when a change is about to be persisted through some OTHER path
// (the explicit Save button, or an entry being deleted) so a stray
// debounce timer can't fire afterwards and redo/undo that action.
function cancelAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = null;
  autosaveDirty = false;
  autosavePendingDate = null;
  setAutosaveIndicator('idle');
}

// Immediately writes whatever change is pending, if any — a no-op if
// nothing is dirty. This is called both by the natural 2s debounce timer
// AND synchronously from loadEntry()/switchTab() so a pending change is
// always written before the app moves on to a different date or tab.
async function flushAutosave() {
  clearTimeout(autosaveTimer);
  if (!autosaveDirty || !autosavePendingDate) return;
  const dateToSave = autosavePendingDate;
  autosaveDirty = false;
  autosavePendingDate = null;
  setAutosaveIndicator('saving');
  try {
    // `state` still correctly reflects `dateToSave` here: flushAutosave
    // only ever runs while that date is still the one loaded (the normal
    // debounce case), or synchronously from loadEntry()/switchTab() —
    // both of which call this BEFORE reassigning `state` to a new date.
    const result = await window.storage.set('journal:' + dateToSave, JSON.stringify(state));
    if (result) { renderTrail(); renderStreak(); setAutosaveIndicator('saved'); }
    else setAutosaveIndicator('idle');
  } catch (err) {
    setAutosaveIndicator('idle');
  }
}

function setAutosaveIndicator(mode) {
  const el = document.getElementById('autosaveIndicator');
  if (!el) return;
  if (mode === 'saving') {
    el.className = 'autosave-indicator show';
    el.innerHTML = '<span class="as-dot"></span>' + t('write.autosaveSaving');
  } else if (mode === 'saved') {
    el.className = 'autosave-indicator show saved';
    el.innerHTML = '<span class="as-dot"></span>' + t('write.autosaveSaved');
    setTimeout(() => { if (el.classList.contains('saved')) el.classList.remove('show'); }, 3000);
  } else {
    el.className = 'autosave-indicator';
    el.innerHTML = '';
  }
}

// Best-effort save on page close. window.storage's underlying
// localStorage.setItem call is synchronous, so it still completes even
// though we don't (can't meaningfully) await the wrapping Promise here.
window.addEventListener('beforeunload', () => { if (autosaveDirty) flushAutosave(); });

// ---------- LOAD / SAVE ----------
async function loadEntry(dateStr) {
  await flushAutosave(); // persist any pending change for the date we're leaving, first
  if (typeof closeFocusMode === 'function') closeFocusMode();
  currentDate = dateStr;
  setAutosaveIndicator('idle');
  document.getElementById('dateTitle').textContent = dateStr === todayStr() ? t('common.today') : fmtTitle(dateStr);
  document.getElementById('datePicker').value = dateStr;
  document.getElementById('saveStatus').textContent = '';
  try {
    const res = await window.storage.get('journal:' + dateStr);
    state = res ? Object.assign(emptyEntry(), JSON.parse(res.value)) : emptyEntry();
  } catch (err) { state = emptyEntry(); }

  // One-time migration: older entries stored a single base64 photo
  // directly on the entry (state.photo). Move it into the IndexedDB
  // gallery the first time that entry is opened, then drop the old field.
  if (state.photo && (!state.photos || !state.photos.length)) {
    try {
      const blob = dataURLToBlob(state.photo);
      const id = await ImageStore.importBlob(dateStr, blob, 0);
      state.photos = [id];
    } catch (err) { console.warn('Could not migrate legacy photo:', err); }
    delete state.photo;
    await window.storage.set('journal:' + dateStr, JSON.stringify(state));
  }

  document.getElementById('notes').value = state.notes || '';
  document.getElementById('stepsInput').value = state.steps || '';
  document.getElementById('screenTimeInput').value = state.screenTime || '';
  document.getElementById('moneyInput').value = state.moneySpent || '';
  document.getElementById('highlightInput').value = state.highlight || '';
  document.getElementById('lowlightInput').value = state.lowlight || '';
  document.getElementById('tomorrowInput').value = state.tomorrowFocus || '';
  document.getElementById('grat0').value = state.gratitude[0] || '';
  document.getElementById('grat1').value = state.gratitude[1] || '';
  document.getElementById('grat2').value = state.gratitude[2] || '';

  updateWordMeter();
  renderMood();
  renderFavToggle();
  renderAllChips();
  await renderGallery();
  renderTrail();
  renderThrowback();
  renderStreak();
}

// Low-level save: persists the current entry. Used both by the explicit
// Save button (via handleSaveButtonClick below) and by silent autosaves
// triggered from the photo gallery (add/remove/reorder) — those should
// never trigger the "redirect to Home" behavior, only an explicit Save
// button click should. Pass { suppressStatus: true } to skip the default
// status message when the caller wants to show its own.
async function saveEntry(opts) {
  opts = opts || {};
  const btn = document.getElementById('saveBtn');
  const status = document.getElementById('saveStatus');
  if (!opts.silent) { btn.textContent = t('write.saving'); btn.disabled = true; }
  let success = false;
  try {
    const result = await window.storage.set('journal:' + currentDate, JSON.stringify(state));
    success = !!result;
    renderTrail(); renderStreak();
    if (!opts.suppressStatus) {
      status.textContent = success ? t('write.saved') : t('write.saveError');
      setTimeout(() => { status.textContent = ''; }, 2500);
    }
  } catch (err) {
    if (!opts.suppressStatus) { status.textContent = t('write.saveError'); setTimeout(() => { status.textContent = ''; }, 2500); }
  }
  if (!opts.silent) { btn.textContent = t('write.saveButton'); btn.disabled = false; }
  return success;
}

// What actually happens when the person presses "Save today's entry"
// (or the Save button inside Focus mode, which reuses this same logic):
// save, show a clear confirmation, and — only if this was TODAY's entry,
// never an older date — glide back to the Home dashboard a moment later
// so it's immediately visible with fresh data.
async function handleSaveButtonClick() {
  cancelAutosave();
  if (typeof closeFocusMode === 'function') closeFocusMode();
  const wasToday = currentDate === todayStr();
  const status = document.getElementById('saveStatus');
  const success = await saveEntry({ suppressStatus: true });

  if (!success) {
    status.textContent = t('write.saveError');
    setTimeout(() => { status.textContent = ''; }, 2500);
    return;
  }

  renderHome(); // keep the dashboard's data fresh even if we don't navigate there

  if (wasToday) {
    status.textContent = t('write.savedTodayRedirect');
    status.classList.add('save-status-success');
    setTimeout(() => {
      status.classList.remove('save-status-success');
      status.textContent = '';
      switchTab('home');
    }, 1000);
  } else {
    status.textContent = t('write.saved');
    setTimeout(() => { status.textContent = ''; }, 2500);
  }
}
document.getElementById('saveBtn').addEventListener('click', handleSaveButtonClick);
document.getElementById('datePicker').addEventListener('change', (e) => { if (e.target.value) loadEntry(e.target.value); });

// ---------- DELETE ENTRY ----------
// Deletes the entry currently open in the Write tab (currentDate).
// Removes: the journal record itself (localStorage), and every photo
// that belonged to it (IndexedDB) — photo IDs are never shared between
// entries in this app's data model, so there's no "used elsewhere" case
// to worry about; deleting them here is always safe.
async function deleteEntry(dateStr) {
  cancelAutosave(); // a pending debounce must never resurrect a just-deleted entry
  try { await ImageStore.deleteAllForEntry(dateStr); } catch (e) { console.warn('Could not delete images for entry:', e); }
  try { await window.storage.delete('journal:' + dateStr); } catch (e) { console.warn('Could not delete entry:', e); }

  if (dateStr === currentDate) state = emptyEntry();

  // Nothing else needs to be individually "told" about the deletion:
  // the calendar, search, stats, favorites, and insights all recompute
  // straight from storage every time their tab is opened, so simply
  // removing the record here is sufficient — see README for details.
  showActionToast({ icon: '🗑️', label: t('write.entryDeletedToast') });
  switchTab('home');
}

document.getElementById('deleteEntryBtn').addEventListener('click', async () => {
  const ok = await showConfirmDialog({
    title: t('write.deleteConfirmTitle'),
    message: t('write.deleteConfirmMessage'),
    confirmLabel: t('write.deleteConfirmAction'),
    cancelLabel: t('common.cancel'),
    danger: true,
  });
  if (!ok) return;
  await deleteEntry(currentDate);
});

// ---------- THROWBACK (on this day last year) ----------
async function renderThrowback() {
  const wrap = document.getElementById('throwbackWrap');
  wrap.innerHTML = '';
  const lastYearDate = currentDate.replace(/^(\d{4})/, (y) => String(parseInt(y) - 1));
  try {
    const res = await window.storage.get('journal:' + lastYearDate);
    if (res) {
      const entry = JSON.parse(res.value);
      const moodObj = entry.mood ? MOODS.find(m => m.id === entry.mood) : null;
      const card = document.createElement('section');
      card.className = 'card throwback-card';
      card.innerHTML = '<h2>⏳ ' + t('write.throwbackTitle') + '</h2><p>' + (moodObj ? moodObj.emoji + ' ' : '') + ((entry.notes || t('common.noNoteWritten')).slice(0, 180)) + '</p>';
      wrap.appendChild(card);
      attachEntryThumbnail(card, entry);
    }
  } catch (e) {}
}

// ---------- STREAK ----------
async function renderStreak() {
  const badge = document.getElementById('streakBadge');
  let streak = 0;
  let d = todayStr();
  try {
    while (true) {
      const res = await window.storage.get('journal:' + d);
      if (!res) break;
      streak++;
      d = addDaysStr(d, -1);
      if (streak > 730) break;
    }
  } catch (e) {}
  badge.textContent = streak > 0 ? ('🔥 ' + t('home.streakCount', { count: streak })) : '';
}

// ---------- HOME DASHBOARD ----------
const REFLECTION_QUESTION_COUNT = 15;
const STREAK_MILESTONES = [7, 30, 100, 365, 1000];
const MOOD_VALUE = { awful: 1, bad: 2, okay: 3, good: 4, great: 5 };

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}
function getReflectionQuestion() {
  const index = (dayOfYear(new Date()) % REFLECTION_QUESTION_COUNT) + 1;
  return t('reflection.q' + index);
}
function historyItemHTML(date, entry, emojiOverride) {
  const m = entry.mood ? MOODS.find(mo => mo.id === entry.mood) : null;
  const photoBadge = entry.photos && entry.photos.length ? ' <span class="hi-photo-count">📷' + entry.photos.length + '</span>' : '';
  return '<span class="hi-emoji">' + (emojiOverride || (m ? m.emoji : '📓')) + '</span><div><div class="hi-date">' + fmtTitle(date) + photoBadge + '</div><div class="hi-preview">' + ((entry.notes || t('common.noNoteWritten')).slice(0,60)) + '</div></div>';
}

async function renderHome() {
  const all = await getAllEntriesEver();
  all.sort((a, b) => b.date.localeCompare(a.date));
  window._homeEntries = all;
  const dateSet = new Set(all.map(a => a.date));
  const today = todayStr();
  const yDate = addDaysStr(today, -1);

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 6 ? t('home.greetNight') : hour < 12 ? t('home.greetMorning') : hour < 18 ? t('home.greetAfternoon') : t('home.greetEvening');
  document.getElementById('greetingBox').innerHTML = '<div class="greet-text">' + greet + '</div><div class="greet-date">' + fmtTitle(today) + '</div>';

  // Today status
  const todayEntry = all.find(a => a.date === today);
  const statusCard = document.getElementById('todayStatusCard');
  if (todayEntry && todayEntry.entry.mood) {
    statusCard.innerHTML = '<div class="status-cta"><div>✅ ' + t('home.writtenToday') + '</div></div>';
  } else {
    statusCard.innerHTML = '<div class="status-cta"><div>📝 ' + t('home.notWrittenToday') + '</div><button id="goWriteBtn">' + t('home.writeNow') + '</button></div>';
    document.getElementById('goWriteBtn').onclick = () => { loadEntry(today); switchTab('write'); };
  }

  // Streak progress
  let streak = 0; let d = today;
  while (dateSet.has(d)) { streak++; d = addDaysStr(d, -1); }
  const nm = STREAK_MILESTONES.find(m => streak < m) || null;
  const prevM = STREAK_MILESTONES.slice().reverse().find(m => m <= streak) || 0;
  const progressPct = nm ? Math.round(((streak - prevM) / (nm - prevM)) * 100) : 100;
  document.getElementById('streakProgressBox').innerHTML =
    '<div class="streak-progress-num">🔥 ' + t('home.streakDays', { count: streak }) + '</div>' +
    '<div class="stat-track"><div class="stat-fill" style="width:' + progressPct + '%; background:var(--amber)"></div></div>' +
    '<div class="streak-progress-sub">' + (nm ? t('home.daysUntilMilestone', { days: nm - streak, milestone: nm }) : t('home.topMilestoneReached')) + '</div>';

  // Latest mood
  const latest = all.find(a => a.entry.mood);
  const latestBox = document.getElementById('latestMoodBox');
  latestBox.innerHTML = latest
    ? '<div style="font-size:32px; line-height:1; margin:14px 0;">' + MOODS.find(m => m.id === latest.entry.mood).emoji + '</div><div class="sub" style="margin-bottom:0;">' + fmtTitle(latest.date) + '</div>'
    : '<div class="stat-empty">' + t('home.noMoodYet') + '</div>';

  // Week trend
  function avgRange(startAgo, endAgo) {
    let sum = 0, count = 0;
    for (let i = startAgo; i <= endAgo; i++) {
      const found = all.find(a => a.date === addDaysStr(today, -i));
      if (found && found.entry.mood) { sum += MOOD_VALUE[found.entry.mood]; count++; }
    }
    return count ? sum / count : null;
  }
  const thisWeek = avgRange(0, 6), lastWeek = avgRange(7, 13);
  const trendBox = document.getElementById('weekTrendBox');
  if (thisWeek === null || lastWeek === null) {
    trendBox.innerHTML = '<div class="stat-empty">' + t('home.needMoreDataTrend') + '</div>';
  } else {
    const diff = thisWeek - lastWeek;
    let arrow = '→', text = t('home.trendSame'), color = 'var(--muted)';
    if (diff > 0.15) { arrow = '↑'; text = t('home.trendUp'); color = 'var(--sage)'; }
    else if (diff < -0.15) { arrow = '↓'; text = t('home.trendDown'); color = 'var(--rose)'; }
    trendBox.innerHTML = '<div class="trend-box"><span class="trend-arrow" style="color:' + color + '">' + arrow + '</span><span class="trend-text">' + text + '</span></div>';
  }

  // Today's goal (from yesterday's "imorgon vill jag")
  const yEntry = all.find(a => a.date === yDate);
  const goalBox = document.getElementById('todaysGoalBox');
  goalBox.innerHTML = (yEntry && yEntry.entry.tomorrowFocus)
    ? '<p style="margin:0; font-size:14px;">' + yEntry.entry.tomorrowFocus + '</p>'
    : '<div class="stat-empty">' + t('home.noGoalYesterday') + '</div>';

  // Reflection question
  document.getElementById('reflectionQBox').innerHTML = '<p style="margin:0; font-size:14.5px; font-style:italic;">' + getReflectionQuestion() + '</p>';

  // Yesterday box
  const yBox = document.getElementById('yesterdayBox');
  if (yEntry) {
    yBox.innerHTML = '<div class="history-item" id="yesterdayItem">' + historyItemHTML(yEntry.date, yEntry.entry) + '</div>';
    document.getElementById('yesterdayItem').onclick = () => { loadEntry(yEntry.date); switchTab('write'); };
    attachEntryThumbnail(document.getElementById('yesterdayItem'), yEntry.entry);
  } else {
    yBox.innerHTML = '<div class="stat-empty">' + t('home.nothingYesterday') + '</div>';
  }

  // Recent entries
  const recentList = document.getElementById('recentList');
  const recent = all.slice(0, 5);
  recentList.innerHTML = '';
  if (!recent.length) recentList.innerHTML = '<div class="stat-empty">' + t('home.noEntriesYet') + '</div>';
  recent.forEach(({ date, entry }) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = historyItemHTML(date, entry);
    item.onclick = () => { loadEntry(date); switchTab('write'); };
    recentList.appendChild(item);
    attachEntryThumbnail(item, entry);
  });

  // Favorites
  const favList = document.getElementById('favList');
  const favs = all.filter(a => a.entry.favorite).slice(0, 10);
  favList.innerHTML = '';
  if (!favs.length) favList.innerHTML = '<div class="stat-empty">' + t('home.noFavoritesYet') + '</div>';
  favs.forEach(({ date, entry }) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = historyItemHTML(date, entry, '⭐');
    item.onclick = () => { loadEntry(date); switchTab('write'); };
    favList.appendChild(item);
    attachEntryThumbnail(item, entry);
  });

  renderRandomMemory();
  renderThrowbackMulti();

  const { stats, saved } = await checkMilestones(all);
  renderMilestonesGrid(stats, saved);
  renderInsightsInto('insightsBox', all);
}

function renderRandomMemory() {
  const pool = (window._homeEntries || []).filter(a => a.date !== todayStr() && a.entry.notes && a.entry.notes.trim().length > 0);
  const box = document.getElementById('randomMemoryBox');
  if (!pool.length) { box.innerHTML = '<div class="stat-empty">' + t('home.noMemoriesYet') + '</div>'; return; }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  box.innerHTML = '<div class="history-item" id="memItem">' + historyItemHTML(pick.date, pick.entry) + '</div>';
  document.getElementById('memItem').onclick = () => { loadEntry(pick.date); switchTab('write'); };
  attachEntryThumbnail(document.getElementById('memItem'), pick.entry);
}
document.getElementById('rerollMemoryBtn').addEventListener('click', renderRandomMemory);

function renderThrowbackMulti() {
  const list = document.getElementById('throwbackMultiList');
  const dateSet = new Set((window._homeEntries || []).map(a => a.date));
  const [y, m, d] = todayStr().split('-');
  const matches = [];
  for (let back = 1; back <= 8; back++) {
    const ds = (parseInt(y) - back) + '-' + m + '-' + d;
    if (dateSet.has(ds)) matches.push(ds);
  }
  list.innerHTML = '';
  if (!matches.length) { list.innerHTML = '<div class="stat-empty">' + t('home.noThrowbackYet') + '</div>'; return; }
  matches.forEach(ds => {
    const found = (window._homeEntries || []).find(a => a.date === ds);
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = historyItemHTML(ds, found.entry);
    item.onclick = () => { loadEntry(ds); switchTab('write'); };
    list.appendChild(item);
    attachEntryThumbnail(item, found.entry);
  });
}

// ---------- MILSTOLPAR ----------
const MILESTONES = [
  { id: 'streak7',   icon: '🔥', check: s => s.longestStreak >= 7,   progress: s => ({ current: s.longestStreak, target: 7 }) },
  { id: 'streak30',  icon: '🔥', check: s => s.longestStreak >= 30,  progress: s => ({ current: s.longestStreak, target: 30 }) },
  { id: 'streak100', icon: '🔥', check: s => s.longestStreak >= 100, progress: s => ({ current: s.longestStreak, target: 100 }) },
  { id: 'entries1',   icon: '📖', check: s => s.totalEntries >= 1,   progress: s => ({ current: s.totalEntries, target: 1 }) },
  { id: 'entries100', icon: '📖', check: s => s.totalEntries >= 100, progress: s => ({ current: s.totalEntries, target: 100 }) },
  { id: 'entries365', icon: '📖', check: s => s.totalEntries >= 365, progress: s => ({ current: s.totalEntries, target: 365 }) },
  { id: 'words10k',  icon: '✍️', check: s => s.totalWords >= 10000,  progress: s => ({ current: s.totalWords, target: 10000 }) },
  { id: 'words100k', icon: '✍️', check: s => s.totalWords >= 100000, progress: s => ({ current: s.totalWords, target: 100000 }) },
  { id: 'words500k', icon: '✍️', check: s => s.totalWords >= 500000, progress: s => ({ current: s.totalWords, target: 500000 }) },
  { id: 'good100',     icon: '❤️', check: s => s.goodMoodCount >= 100, progress: s => ({ current: s.goodMoodCount, target: 100 }) },
  { id: 'training100', icon: '🏋️', check: s => s.trainingCount >= 100, progress: s => ({ current: s.trainingCount, target: 100 }) },
  { id: 'gratitude100',icon: '🙏', check: s => s.gratitudeCount >= 100, progress: s => ({ current: s.gratitudeCount, target: 100 }) },
];

function wordsOfEntry(entry) {
  const t = (entry.notes || '').trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}
function computeLongestStreak(dates) {
  const sorted = [...new Set(dates)].sort();
  let longest = 0, current = 0, prev = null;
  for (const ds of sorted) {
    if (prev && addDaysStr(prev, 1) === ds) current++; else current = 1;
    longest = Math.max(longest, current);
    prev = ds;
  }
  return longest;
}
function computeMilestoneStats(all) {
  return {
    longestStreak: computeLongestStreak(all.map(a => a.date)),
    totalEntries: all.length,
    totalWords: all.reduce((sum, a) => sum + wordsOfEntry(a.entry), 0),
    goodMoodCount: all.filter(a => a.entry.mood === 'good').length,
    trainingCount: all.filter(a => (a.entry.health || []).some(h => h !== 'noExercise') && (a.entry.health || []).length > 0).length,
    gratitudeCount: all.filter(a => (a.entry.gratitude || []).some(g => g && g.trim().length > 0)).length,
  };
}

async function checkMilestones(all) {
  const stats = computeMilestoneStats(all);
  let saved = [];
  try {
    const res = await window.storage.get('journal:milestones');
    saved = res ? JSON.parse(res.value) : [];
  } catch (e) { saved = []; }
  const newOnes = MILESTONES.filter(ms => ms.check(stats) && !saved.includes(ms.id));
  if (newOnes.length) {
    saved = [...saved, ...newOnes.map(m => m.id)];
    await window.storage.set('journal:milestones', JSON.stringify(saved));
    showMilestoneToast(newOnes);
  }
  return { stats, saved };
}

// Generic toast — a brief, self-dismissing message using the same
// visual mechanic milestone celebrations already used. Reused here for
// entry deletion, and by anything else that just needs to say "done"
// without a full modal.
function showActionToast({ icon, label, duration }) {
  const el = document.getElementById('milestoneToast');
  el.innerHTML = '<div class="mt-icon">' + icon + '</div><div class="mt-label">' + label + '</div>';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration || 3000);
}

function showMilestoneToast(newOnes) {
  if (newOnes.length === 1) {
    showActionToast({ icon: newOnes[0].icon, label: t('milestones.newSingle', { label: t('milestones.' + newOnes[0].id + '.label') }), duration: 4000 });
  } else {
    showActionToast({ icon: '🎉', label: t('milestones.newMultiple', { count: newOnes.length }), duration: 4000 });
  }
}

function renderMilestonesGrid(stats, saved) {
  const wrap = document.getElementById('milestonesGrid');
  if (!wrap) return;
  wrap.innerHTML = '';
  MILESTONES.forEach(ms => {
    const unlocked = saved.includes(ms.id);
    const p = ms.progress(stats);
    const item = document.createElement('div');
    item.className = 'milestone-item' + (unlocked ? ' unlocked' : '');
    item.innerHTML = '<div class="ms-icon">' + (unlocked ? ms.icon : '🔒') + '</div><div class="ms-label">' + t('milestones.' + ms.id + '.label') + '</div>' +
      (!unlocked ? '<div class="ms-progress">' + Math.min(p.current, p.target) + '/' + p.target + '</div>' : '');
    wrap.appendChild(item);
  });
}

// ---------- LOCAL AI INSIGHTS (no external AI, everything computed from your own data) ----------
function computeInsights(all) {
  const MIN_N = 5;
  const insights = [];
  function avgMoodWhere(pred) {
    const vals = all.filter(a => a.entry.mood && pred(a)).map(a => MOOD_VALUE[a.entry.mood]);
    return vals.length ? { avg: vals.reduce((s, v) => s + v, 0) / vals.length, count: vals.length } : null;
  }

  const withTraining = avgMoodWhere(a => (a.entry.health || []).some(h => h !== 'noExercise') && (a.entry.health || []).length > 0);
  const withoutTraining = avgMoodWhere(a => !((a.entry.health || []).some(h => h !== 'noExercise')));
  if (withTraining && withoutTraining && withTraining.count >= MIN_N && withoutTraining.count >= MIN_N && withTraining.avg - withoutTraining.avg > 0.3) {
    insights.push(t('insights.trainingMood'));
  }

  const SLEEP_VALUE = { poor: 1, average: 2, good: 3 };
  const stEntries = all.filter(a => a.entry.screenTime != null && a.entry.sleep);
  if (stEntries.length >= MIN_N * 2) {
    const sorted = [...stEntries].sort((a, b) => a.entry.screenTime - b.entry.screenTime);
    const mid = Math.floor(sorted.length / 2);
    const low = sorted.slice(0, mid), high = sorted.slice(mid);
    const avgLow = low.reduce((s, a) => s + SLEEP_VALUE[a.entry.sleep], 0) / low.length;
    const avgHigh = high.reduce((s, a) => s + SLEEP_VALUE[a.entry.sleep], 0) / high.length;
    if (avgLow - avgHigh > 0.3) insights.push(t('insights.screenSleep'));
  }

  function isWeekend(ds) { const day = new Date(ds + 'T00:00:00').getDay(); return day === 0 || day === 6; }
  const weekend = avgMoodWhere(a => isWeekend(a.date));
  const weekday = avgMoodWhere(a => !isWeekend(a.date));
  if (weekend && weekday && weekend.count >= MIN_N && weekday.count >= MIN_N && weekend.avg - weekday.avg > 0.3) {
    insights.push(t('insights.weekendMood'));
  }

  const withFamily = avgMoodWhere(a => (a.entry.relations || []).includes('Familj'));
  const withoutFamily = avgMoodWhere(a => !(a.entry.relations || []).includes('Familj'));
  if (withFamily && withoutFamily && withFamily.count >= MIN_N && withoutFamily.count >= MIN_N && withFamily.avg - withoutFamily.avg > 0.3) {
    insights.push(t('insights.familyMood'));
  }

  const lowMoodEntries = all.filter(a => a.entry.mood === 'bad' || a.entry.mood === 'awful');
  const highMoodEntries = all.filter(a => a.entry.mood === 'good' || a.entry.mood === 'great');
  if (lowMoodEntries.length >= MIN_N && highMoodEntries.length >= MIN_N) {
    const avgLowW = lowMoodEntries.reduce((s, a) => s + wordsOfEntry(a.entry), 0) / lowMoodEntries.length;
    const avgHighW = highMoodEntries.reduce((s, a) => s + wordsOfEntry(a.entry), 0) / highMoodEntries.length;
    if (avgLowW - avgHighW > 20) insights.push(t('insights.wordsMood'));
  }

  const byWeekday = {};
  all.forEach(a => {
    const day = new Date(a.date + 'T00:00:00').getDay();
    const w = wordsOfEntry(a.entry);
    if (!byWeekday[day]) byWeekday[day] = { sum: 0, count: 0 };
    byWeekday[day].sum += w; byWeekday[day].count++;
  });
  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let bestDay = null, bestAvg = 0;
  Object.entries(byWeekday).forEach(([day, stat]) => {
    if (stat.count >= 3) { const avg = stat.sum / stat.count; if (avg > bestAvg) { bestAvg = avg; bestDay = day; } }
  });
  if (bestDay !== null && all.length >= 14) insights.push(t('insights.mostWordsDay', { day: t('weekday.' + weekdayKeys[bestDay]) }));

  return insights;
}

function renderInsightsInto(elId, all) {
  const box = document.getElementById(elId);
  if (!box) return;
  const insights = computeInsights(all).slice(0, 3);
  if (!insights.length) { box.innerHTML = '<div class="stat-empty">' + t('insights.notEnoughData') + '</div>'; return; }
  box.innerHTML = '<div class="top-list"></div>';
  const wrap = box.querySelector('.top-list');
  insights.forEach(text => {
    const item = document.createElement('div');
    item.className = 'top-item';
    item.innerHTML = '<span>💡 ' + text + '</span>';
    wrap.appendChild(item);
  });
}

// ---------- LIVSKALENDER ----------
let lifeView = 'overview';
let lifeSelectedYear = null;
let lifeEntriesCache = {};
let lifeBirthdate = null;

async function getBirthdate() {
  try { const res = await window.storage.get('journal:birthdate'); return res ? res.value : null; } catch (e) { return null; }
}

async function loadLifeData() {
  const all = await getAllEntriesEver();
  lifeEntriesCache = {};
  all.forEach(a => { lifeEntriesCache[a.date] = a.entry; });
}

function moodLifeColor(moodId) {
  if (moodId === 'great' || moodId === 'good') return 'var(--sage)';
  if (moodId === 'okay') return 'var(--amber)';
  if (moodId === 'bad' || moodId === 'awful') return 'var(--rose)';
  return null;
}

function renderLifeLegend() {
  document.getElementById('lifeLegend').innerHTML =
    '<span><span class="lg-swatch" style="background:var(--sage)"></span>' + t('life.legendGood') + '</span>' +
    '<span><span class="lg-swatch" style="background:var(--amber)"></span>' + t('life.legendOkay') + '</span>' +
    '<span><span class="lg-swatch" style="background:var(--rose)"></span>' + t('life.legendBad') + '</span>' +
    '<span><span class="lg-swatch" style="background:var(--surface-2)"></span>' + t('life.legendNone') + '</span>';
}

async function renderLife() {
  lifeBirthdate = await getBirthdate();
  const setupBox = document.getElementById('lifeSetupBox');
  const content = document.getElementById('lifeContent');

  if (!lifeBirthdate) {
    content.style.display = 'none';
    setupBox.innerHTML =
      '<section class="card"><h2>🗓️ ' + t('life.title') + '</h2>' +
      '<p class="sub">' + t('life.setupText') + '</p>' +
      '<input type="date" class="plain" id="birthdateInput" style="margin-bottom:12px;">' +
      '<button class="export-btn" id="saveBirthdateBtn">' + t('life.createButton') + '</button></section>';
    document.getElementById('saveBirthdateBtn').onclick = async () => {
      const val = document.getElementById('birthdateInput').value;
      if (!val) return;
      await window.storage.set('journal:birthdate', val);
      lifeBirthdate = val;
      setupBox.innerHTML = '';
      content.style.display = 'block';
      await loadLifeData();
      renderLifeOverview();
    };
    return;
  }

  setupBox.innerHTML = '';
  content.style.display = 'block';
  await loadLifeData();
  if (lifeView === 'year' && lifeSelectedYear) renderYearGrid(lifeSelectedYear);
  else renderLifeOverview();
}

function renderLifeOverview() {
  lifeView = 'overview';
  document.getElementById('lifeNav').style.display = 'none';
  const wrap = document.getElementById('lifeGridWrap');
  wrap.innerHTML = '';
  const birthYear = parseInt(lifeBirthdate.slice(0, 4));
  const currentYear = new Date().getFullYear();
  const endYear = birthYear + 90; // estimated lifespan; the rest is faded out
  const today = new Date();

  for (let year = birthYear; year <= endYear; year++) {
    const row = document.createElement('div');
    row.className = 'life-row';
    const label = document.createElement('div');
    label.className = 'life-year-label';
    label.textContent = year;
    row.appendChild(label);
    const strip = document.createElement('div');
    strip.className = 'life-strip';

    for (let w = 0; w < 52; w++) {
      const cell = document.createElement('div');
      cell.className = 'life-cell';
      const weekStart = new Date(year, 0, 1 + w * 7);
      if (weekStart > today) {
        cell.classList.add('future');
      } else {
        let sum = 0, count = 0;
        for (let d = 0; d < 7; d++) {
          const dd = new Date(year, 0, 1 + w * 7 + d);
          const ds = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
          const entry = lifeEntriesCache[ds];
          if (entry && entry.mood) { sum += MOOD_VALUE[entry.mood]; count++; }
        }
        if (count) {
          const avg = sum / count;
          cell.style.background = avg >= 3.5 ? 'var(--sage)' : avg >= 2.5 ? 'var(--amber)' : 'var(--rose)';
        }
      }
      strip.appendChild(cell);
    }
    row.appendChild(strip);
    if (year <= currentYear) row.onclick = () => { renderYearGrid(year); };
    wrap.appendChild(row);
  }
  renderLifeLegend();
}

function renderYearGrid(year) {
  lifeView = 'year';
  lifeSelectedYear = year;
  document.getElementById('lifeNav').style.display = 'flex';
  document.getElementById('lifeYearTitle').textContent = year;
  const wrap = document.getElementById('lifeGridWrap');
  wrap.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'year-grid';
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  let start = new Date(jan1); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  let end = new Date(dec31); end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));
  const today = new Date();
  const birth = new Date(lifeBirthdate + 'T00:00:00');

  let cursor = new Date(start);
  while (cursor <= end) {
    const inYear = cursor.getFullYear() === year;
    const cell = document.createElement('div');
    cell.className = 'year-cell';
    if (!inYear) {
      cell.classList.add('hidden-slot');
    } else {
      const ds = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0');
      if (cursor > today) cell.classList.add('future');
      else if (cursor < birth) cell.classList.add('prebirth');
      else {
        const entry = lifeEntriesCache[ds];
        if (entry && entry.mood) {
          cell.classList.add('has-entry');
          cell.style.background = moodLifeColor(entry.mood) || 'var(--surface-2)';
          cell.title = fmtTitle(ds) + ' — ' + t('mood.' + entry.mood);
          cell.onclick = () => {
            cell.style.transform = 'scale(1.6)';
            setTimeout(() => { loadEntry(ds); switchTab('write'); }, 150);
          };
        } else {
          cell.title = fmtTitle(ds) + ' — ingen journal';
        }
      }
    }
    grid.appendChild(cell);
    cursor.setDate(cursor.getDate() + 1);
  }
  wrap.appendChild(grid);
  renderLifeLegend();
}

document.getElementById('lifeBackBtn').addEventListener('click', renderLifeOverview);

// ---------- ANNUAL SUMMARY (WRAPPED) ----------
let wrappedYear = new Date().getFullYear();

function tally(arr) { const c = {}; arr.forEach(v => { c[v] = (c[v] || 0) + 1; }); return c; }
function topOf(counts) {
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0];
}
function moodByValue(v) {
  const rounded = Math.round(v);
  return MOODS.find(m => MOOD_VALUE[m.id] === rounded) || MOODS[2];
}

function computeWrappedStats(yearEntries, year, globalDateSet) {
  const daysWritten = yearEntries.length;
  const totalWords = yearEntries.reduce((s, a) => s + wordsOfEntry(a.entry), 0);
  const avgWords = daysWritten ? Math.round(totalWords / daysWritten) : 0;

  const withMood = yearEntries.filter(a => a.entry.mood);
  const moodAvg = withMood.length ? withMood.reduce((s, a) => s + MOOD_VALUE[a.entry.mood], 0) / withMood.length : null;
  const goodDays = yearEntries.filter(a => a.entry.mood === 'good' || a.entry.mood === 'great').length;
  const badDays = yearEntries.filter(a => a.entry.mood === 'bad' || a.entry.mood === 'awful').length;

  const monthStats = Array.from({ length: 12 }, () => ({ sum: 0, count: 0, entries: 0 }));
  yearEntries.forEach(a => {
    const month = parseInt(a.date.slice(5, 7)) - 1;
    monthStats[month].entries++;
    if (a.entry.mood) { monthStats[month].sum += MOOD_VALUE[a.entry.mood]; monthStats[month].count++; }
  });
  const monthNames = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
  let bestMonth = null, bestAvg = -1, worstMonth = null, worstAvg = 6, mostEntriesMonth = null, mostEntriesCount = 0;
  monthStats.forEach((m, i) => {
    if (m.count > 0) {
      const avg = m.sum / m.count;
      if (avg > bestAvg) { bestAvg = avg; bestMonth = i; }
      if (avg < worstAvg) { worstAvg = avg; worstMonth = i; }
    }
    if (m.entries > mostEntriesCount) { mostEntriesCount = m.entries; mostEntriesMonth = i; }
  });

  const feelingsCount = {};
  yearEntries.forEach(a => (a.entry.feelings || []).forEach(f => { feelingsCount[f] = (feelingsCount[f] || 0) + 1; }));
  const topFeeling = topOf(feelingsCount);
  const topFeelingsList = Object.entries(feelingsCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const hobbyCount = {}; yearEntries.forEach(a => (a.entry.hobbies || []).forEach(h => { hobbyCount[h] = (hobbyCount[h] || 0) + 1; }));
  const topHobby = topOf(hobbyCount);

  const trainingCountMap = {};
  yearEntries.forEach(a => (a.entry.health || []).forEach(h => { if (h !== 'noExercise') trainingCountMap[h] = (trainingCountMap[h] || 0) + 1; }));
  const topTraining = topOf(trainingCountMap);
  const totalTrainingDays = yearEntries.filter(a => (a.entry.health || []).some(h => h !== 'noExercise') && (a.entry.health || []).length > 0).length;

  const foodCount = {}; yearEntries.forEach(a => (a.entry.food || []).forEach(f => { foodCount[f] = (foodCount[f] || 0) + 1; }));
  const topFood = topOf(foodCount);

  const weatherCount = {}; yearEntries.forEach(a => { if (a.entry.weather) weatherCount[a.entry.weather] = (weatherCount[a.entry.weather] || 0) + 1; });
  const topWeather = topOf(weatherCount);

  const gratitudeDays = yearEntries.filter(a => (a.entry.gratitude || []).some(g => g && g.trim())).length;

  const longestStreak = computeLongestStreak(yearEntries.map(a => a.date));

  let perfectWeeks = 0;
  let cursor = new Date(year, 0, 1);
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
  const yearEnd = new Date(year, 11, 31);
  while (cursor <= yearEnd) {
    let allSeven = true;
    for (let d = 0; d < 7; d++) {
      const dd = new Date(cursor); dd.setDate(dd.getDate() + d);
      const ds = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
      if (!globalDateSet.has(ds)) { allSeven = false; break; }
    }
    if (allSeven) perfectWeeks++;
    cursor.setDate(cursor.getDate() + 7);
  }

  return { daysWritten, totalWords, avgWords, moodAvg, goodDays, badDays, bestMonth, worstMonth, monthStats,
    topFeeling, topFeelingsList, topHobby, topTraining, totalTrainingDays, topFood, topWeather, gratitudeDays,
    longestStreak, perfectWeeks, mostEntriesMonth, mostEntriesCount };
}

function buildWrappedHTML(s, year) {
  let monthBars = '';
  s.monthStats.forEach((m, i) => {
    const avg = m.count ? m.sum / m.count : 0;
    const heightPct = m.count ? Math.max(8, (avg / 5) * 100) : 4;
    const color = !m.count ? 'var(--surface-2)' : avg >= 3.5 ? 'var(--sage)' : avg >= 2.5 ? 'var(--amber)' : 'var(--rose)';
    monthBars += '<div class="month-bar-wrap"><div class="month-bar" style="height:' + heightPct + '%; background:' + color + ';"></div><div class="month-bar-label">' + t('monthsShort.' + i) + '</div></div>';
  });

  const facts = [];
  if (s.mostEntriesMonth != null) facts.push(t('wrapped.factMostInMonth', { month: t('months.' + s.mostEntriesMonth) }));
  if (s.totalTrainingDays > 0) facts.push(t('wrapped.factTrained', { count: s.totalTrainingDays }));
  if (s.gratitudeDays > 0) facts.push(t('wrapped.factGrateful', { count: s.gratitudeDays }));
  if (s.totalWords > 0) facts.push(t('wrapped.factTotalWords', { count: formatNumber(s.totalWords) }));
  if (s.longestStreak > 0) facts.push(t('wrapped.factLongestStreak', { count: s.longestStreak }));
  if (s.perfectWeeks > 0) facts.push(t('wrapped.factPerfectWeeks', { count: s.perfectWeeks }));

  let html = '';

  html += '<div class="wrap-card theme-amber"><h3>📖 ' + t('wrapped.entriesTitle') + '</h3>' +
    '<div class="wrap-big">' + s.daysWritten + '</div><div class="wrap-sub">' + t('wrapped.daysIn', { year }) + '</div>' +
    '<div class="wrap-stat-row"><span>' + t('wrapped.totalWords') + '</span><span>' + formatNumber(s.totalWords) + '</span></div>' +
    '<div class="wrap-stat-row"><span>' + t('wrapped.avgWordsPerDay') + '</span><span>' + s.avgWords + '</span></div></div>';

  html += '<div class="wrap-card theme-sage"><h3>🙂 ' + t('wrapped.moodTitle') + '</h3>';
  if (s.moodAvg != null) {
    const ml = moodByValue(s.moodAvg);
    html += '<div class="wrap-big">' + ml.emoji + '</div><div class="wrap-sub">' + t('wrapped.avgMood', { label: t('mood.' + ml.id) }) + '</div>';
  } else {
    html += '<div class="wrap-sub">' + t('wrapped.noMoodLogged') + '</div>';
  }
  html += '<div class="wrap-stat-row"><span>Glada dagar</span><span>' + s.goodDays + '</span></div>' +
    '<div class="wrap-stat-row"><span>' + t('wrapped.badDays') + '</span><span>' + s.badDays + '</span></div>' +
    (s.bestMonth != null ? '<div class="wrap-stat-row"><span>' + t('wrapped.bestMonth') + '</span><span>' + t('months.' + s.bestMonth) + '</span></div>' : '') +
    (s.worstMonth != null ? '<div class="wrap-stat-row"><span>' + t('wrapped.worstMonth') + '</span><span>' + t('months.' + s.worstMonth) + '</span></div>' : '') +
    '<div class="month-chart">' + monthBars + '</div></div>';

  html += '<div class="wrap-card theme-purple"><h3>' + t('wrapped.feelingsTitle') + '</h3>' +
    (s.topFeeling ? '<div class="wrap-big" style="font-size:22px;">' + displayLabel('feelings', s.topFeeling[0]) + '</div><div class="wrap-sub">' + t('wrapped.topFeelingSub', { count: s.topFeeling[1] }) + '</div>' : '<div class="wrap-sub">' + t('wrapped.noFeelings') + '</div>');
  if (s.topFeelingsList.length) {
    html += '<div style="margin-top:12px;">';
    s.topFeelingsList.forEach(([f, c]) => { html += '<div class="wrap-stat-row"><span>' + displayLabel('feelings', f) + '</span><span>' + c + '×</span></div>'; });
    html += '</div>';
  }
  html += '</div>';

  const hasActivity = s.topHobby || s.topTraining || s.topFood || s.topWeather;
  html += '<div class="wrap-card theme-amber"><h3>' + t('wrapped.activitiesTitle') + '</h3>' +
    (s.topHobby ? '<div class="wrap-stat-row"><span>' + t('wrapped.topHobby') + '</span><span>' + displayLabel('hobbies', s.topHobby[0]) + ' (' + s.topHobby[1] + '×)</span></div>' : '') +
    (s.topTraining ? '<div class="wrap-stat-row"><span>' + t('wrapped.topTraining') + '</span><span>' + displayLabel('health', s.topTraining[0]) + ' (' + s.topTraining[1] + '×)</span></div>' : '') +
    (s.topFood ? '<div class="wrap-stat-row"><span>' + t('wrapped.topFood') + '</span><span>' + displayLabel('food', s.topFood[0]) + ' (' + s.topFood[1] + '×)</span></div>' : '') +
    (s.topWeather ? '<div class="wrap-stat-row"><span>' + t('wrapped.topWeather') + '</span><span>' + displayLabel('weather', s.topWeather[0]) + ' (' + s.topWeather[1] + '×)</span></div>' : '') +
    (!hasActivity ? '<div class="wrap-sub">' + t('wrapped.noActivity') + '</div>' : '') + '</div>';

  html += '<div class="wrap-card theme-rose"><h3>🔥 ' + t('wrapped.statsTitle') + '</h3>' +
    '<div class="wrap-stat-row"><span>' + t('wrapped.longestStreak') + '</span><span>' + t('wrapped.daysUnit', { count: s.longestStreak }) + '</span></div>' +
    '<div class="wrap-stat-row"><span>' + t('wrapped.perfectWeeks') + '</span><span>' + s.perfectWeeks + '</span></div>' +
    (s.mostEntriesMonth != null ? '<div class="wrap-stat-row"><span>' + t('wrapped.mostEntriesIn') + '</span><span>' + t('months.' + s.mostEntriesMonth) + ' (' + s.mostEntriesCount + ')</span></div>' : '') +
    '</div>';

  if (facts.length) {
    html += '<div class="wrap-card theme-purple"><h3>🎉 Roliga fakta</h3>';
    facts.forEach(f => { html += '<div class="wrap-fact">' + f + '</div>'; });
    html += '</div>';
  }

  return html;
}

async function renderWrapped() {
  document.getElementById('wrappedYearTitle').textContent = wrappedYear;
  const all = await getAllEntriesEver();
  const yearEntries = all.filter(a => a.date.startsWith(String(wrappedYear)));
  const content = document.getElementById('wrappedContent');
  if (!yearEntries.length) {
    content.innerHTML = '<div class="stat-empty">' + t('wrapped.noEntriesThisYear', { year: wrappedYear }) + '</div>';
    return;
  }
  const globalDateSet = new Set(all.map(a => a.date));
  const stats = computeWrappedStats(yearEntries, wrappedYear, globalDateSet);
  content.innerHTML = buildWrappedHTML(stats, wrappedYear);
}
document.getElementById('wrappedPrevYear').addEventListener('click', () => { wrappedYear--; renderWrapped(); });
document.getElementById('wrappedNextYear').addEventListener('click', () => { wrappedYear++; renderWrapped(); });

// ---------- MONTH DATA ----------
async function getAllEntriesForMonth(year, month) {
  const prefix = 'journal:' + year + '-' + String(month + 1).padStart(2, '0');
  let entries = {};
  try {
    const list = await window.storage.list(prefix);
    if (list && list.keys) {
      for (const k of list.keys) {
        try { const r = await window.storage.get(k); if (r) entries[k.replace('journal:', '')] = JSON.parse(r.value); } catch (e) {}
      }
    }
  } catch (e) {}
  return entries;
}

async function renderTrail() {
  const trail = document.getElementById('trail');
  trail.innerHTML = '';
  const [y, m] = currentDate.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const entries = await getAllEntriesForMonth(y, m - 1);
  for (let d = 1; d <= days; d++) {
    const dStr = currentDate.slice(0,7) + '-' + String(d).padStart(2, '0');
    const entry = entries[dStr];
    const dot = document.createElement('div');
    dot.className = 'trail-dot' + (dStr === currentDate ? ' active' : '') + (!entry || !entry.mood ? ' empty' : '');
    if (entry && entry.mood) { dot.style.background = MOODS.find(mo => mo.id === entry.mood).color; dot.style.height = '28px'; }
    else dot.style.height = '6px';
    dot.title = dStr;
    dot.onclick = () => loadEntry(dStr);
    trail.appendChild(dot);
  }
}

// ---------- CALENDAR TAB ----------
async function renderCalendar() {
  const y = calViewDate.getFullYear(), m = calViewDate.getMonth();
  document.getElementById('calTitle').textContent = calViewDate.toLocaleDateString(localeTag(), { month: 'long', year: 'numeric' });
  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';
  t('calendar.dowInitials').split(',').forEach(d => { const el = document.createElement('div'); el.className='cal-dow'; el.textContent=d; grid.appendChild(el); });
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const entries = await getAllEntriesForMonth(y, m);
  for (let i = 0; i < firstDow; i++) { const el = document.createElement('div'); el.className = 'cal-day empty-slot'; grid.appendChild(el); }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const entry = entries[dStr];
    const el = document.createElement('div');
    el.className = 'cal-day' + (dStr === todayStr() ? ' today' : '');
    if (entry && entry.mood) el.style.background = MOODS.find(mo => mo.id === entry.mood).color + '33';
    el.innerHTML = d + (entry && entry.mood ? '<span class="emo">' + MOODS.find(mo=>mo.id===entry.mood).emoji + '</span>' : '');
    el.onclick = () => { loadEntry(dStr); switchTab('write'); };
    grid.appendChild(el);
  }
  renderHistory(entries);
}
function renderHistory(entries) {
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  const dates = Object.keys(entries).sort().reverse();
  if (!dates.length) { list.innerHTML = '<div class="stat-empty">' + t('calendar.noEntriesThisMonth') + '</div>'; return; }
  dates.forEach(dStr => {
    const entry = entries[dStr];
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = historyItemHTML(dStr, entry);
    item.onclick = () => { loadEntry(dStr); switchTab('write'); };
    list.appendChild(item);
    attachEntryThumbnail(item, entry);
  });
}
document.getElementById('calPrev').addEventListener('click', () => { calViewDate.setMonth(calViewDate.getMonth()-1); renderCalendar(); });
document.getElementById('calNext').addEventListener('click', () => { calViewDate.setMonth(calViewDate.getMonth()+1); renderCalendar(); });

// ---------- SEARCH TAB ----------
async function getAllEntriesEver() {
  let all = [];
  try {
    const list = await window.storage.list('journal:');
    if (list && list.keys) {
      for (const k of list.keys) {
        if (!/^journal:\d{4}-\d{2}-\d{2}$/.test(k)) continue;
        try { const r = await window.storage.get(k); if (r) all.push({ date: k.replace('journal:', ''), entry: JSON.parse(r.value) }); } catch (e) {}
      }
    }
  } catch (e) {}
  return all;
}
const SEARCH_CAT_FIELDS = ['feelings','health','hobbies','food','social','self','chores','beauty','relations','places'];
const SEARCH_SINGLE_FIELDS = ['sleep','energy','weather'];

function entryMatches(entry, q) {
  const parts = [entry.notes, entry.highlight, entry.lowlight, entry.tomorrowFocus, ...(entry.gratitude || [])];

  SEARCH_CAT_FIELDS.forEach(cat => (entry[cat] || []).forEach(v => {
    parts.push(v, translate('en', 'categories.' + cat + '.' + v), translate('sv', 'categories.' + cat + '.' + v));
  }));
  SEARCH_SINGLE_FIELDS.forEach(cat => {
    if (entry[cat]) parts.push(entry[cat], translate('en', 'categories.' + cat + '.' + entry[cat]), translate('sv', 'categories.' + cat + '.' + entry[cat]));
  });

  const hay = parts.filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}
let searchTimeout = null;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => runSearch(e.target.value), 250);
});
async function runSearch(q) {
  const results = document.getElementById('searchResults');
  if (!q || q.trim().length < 2) { results.innerHTML = '<div class="stat-empty">' + t('search.typeMore') + '</div>'; return; }
  const all = await getAllEntriesEver();
  const matches = all.filter(a => entryMatches(a.entry, q.trim())).sort((a,b) => b.date.localeCompare(a.date));
  results.innerHTML = '';
  if (!matches.length) { results.innerHTML = '<div class="stat-empty">' + t('search.noResults') + '</div>'; return; }
  matches.forEach(({ date, entry }) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = historyItemHTML(date, entry);
    item.onclick = () => { loadEntry(date); switchTab('write'); };
    results.appendChild(item);
    attachEntryThumbnail(item, entry);
  });
}

// ---------- STATS TAB ----------
let moodStatView = 'chart';
let lastStatsEntries = [];

function renderMoodStatsView() {
  const moodDiv = document.getElementById('moodStats');
  const withMood = lastStatsEntries.filter(e => e.mood);
  if (!withMood.length) { moodDiv.innerHTML = '<div class="stat-empty">' + t('stats.needMoreData') + '</div>'; return; }

  if (moodStatView === 'chart') {
    moodDiv.innerHTML = '';
    MOODS.forEach(m => {
      const count = withMood.filter(e => e.mood === m.id).length;
      const pct = Math.round((count / withMood.length) * 100);
      const row = document.createElement('div');
      row.className = 'stat-row';
      row.innerHTML = '<div class="stat-label"><span>' + m.emoji + ' ' + t('mood.' + m.id) + '</span><span>' + t('stats.daysCount', { count }) + '</span></div><div class="stat-track"><div class="stat-fill" style="width:' + pct + '%; background:' + m.color + '"></div></div>';
      moodDiv.appendChild(row);
    });
  } else {
    let rows = MOODS.map(m => {
      const count = withMood.filter(e => e.mood === m.id).length;
      const pct = Math.round((count / withMood.length) * 100);
      return '<tr><td>' + m.emoji + ' ' + t('mood.' + m.id) + '</td><td>' + count + '</td><td>' + pct + '%</td></tr>';
    }).join('');
    moodDiv.innerHTML = '<table class="mood-table"><thead><tr><th>' + t('stats.mood') + '</th><th>' + t('stats.days') + '</th><th>' + t('stats.share') + '</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
}
document.querySelectorAll('#moodViewToggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    moodStatView = btn.dataset.view;
    document.querySelectorAll('#moodViewToggle button').forEach(b => b.classList.toggle('active', b === btn));
    renderMoodStatsView();
  });
});

async function renderStats() {
  const all = await getAllEntriesEver();
  const allEntries = all.map(a => a.entry);
  lastStatsEntries = allEntries;
  renderMoodStatsView();
  renderInsightsInto('statsInsightsBox', all);

  const topDiv = document.getElementById('topStats');
  const counts = {};
  ['feelings','health','hobbies','food','social','self','chores','beauty','relations','places'].forEach(cat => {
    allEntries.forEach(e => (e[cat] || []).forEach(v => {
      const key = cat + '|' + v;
      counts[key] = (counts[key] || 0) + 1;
    }));
  });
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
  if (!top.length) { topDiv.innerHTML = '<div class="stat-empty">' + t('stats.noDataYet') + '</div>'; }
  else {
    topDiv.innerHTML = '<div class="top-list"></div>';
    const wrap = topDiv.querySelector('.top-list');
    top.forEach(([key, count]) => {
      const [cat, v] = key.split('|');
      const label = emojiFor(cat, v) + ' ' + displayLabel(cat, v);
      const item = document.createElement('div');
      item.className = 'top-item';
      item.innerHTML = '<span>' + label + '</span><span>' + count + '×</span>';
      wrap.appendChild(item);
    });
  }
}

document.getElementById('exportBtn').addEventListener('click', async () => {
  const all = await getAllEntriesEver();
  const obj = {};
  all.forEach(({ date, entry }) => { obj[date] = entry; });
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'journal-backup-' + todayStr() + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ---------- TABS ----------
function switchTab(name) {
  if (name !== 'write' && autosaveDirty) flushAutosave();
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
  if (name === 'home') renderHome();
  if (name === 'calendar') renderCalendar();
  if (name === 'stats') { renderStats(); renderPinChangeArea(); renderLanguageSwitcher(); }
  if (name === 'life') renderLife();
  if (name === 'wrapped') renderWrapped();
}
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

async function initApp() {
  await loadCustomOptions();
  await loadEntry(todayStr());
  await renderHome();
}

// ================= PWA: Service Worker, installation, updates =================

// --- Registrera Service Worker ---
// Requires a secure context (https:// or localhost). Fails silently otherwise.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => {
        // Check if a new version is already waiting (e.g. if the tab was open when the update downloaded)
        if (reg.waiting) showUpdateBanner(reg);

        // Listen for when a NEW Service Worker starts installing
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            // 'installed' + an already-active worker = this is an update, not the first install
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner(reg);
            }
          });
        });
      })
      .catch(err => console.warn('Service Worker kunde inte registreras:', err));
  });

  // When the new Service Worker takes over, reload the page once so the new files are used
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

function showUpdateBanner(reg) {
  const banner = document.getElementById('updateBanner');
  if (!banner) return;
  banner.classList.add('show');
  document.getElementById('updateReloadBtn').onclick = () => {
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
}

// --- Installationsknapp ---
// beforeinstallprompt is fired by the browser (Chrome/Edge) when the app meets the PWA criteria
// and is NOT already installed. Safari/iOS never fires this event — there, installation
// is handled manually via "Share" -> "Add to Home Screen", so we show instructions instead.
let deferredInstallPrompt = null;

function isRunningStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function showInstallBanner() {
  if (isRunningStandalone()) return; // redan installerad, visa inget
  document.getElementById('installBanner').classList.add('show');
}
function hideInstallBanner() {
  document.getElementById('installBanner').classList.remove('show');
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

window.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('installBtn');
  const dismissBtn = document.getElementById('installDismissBtn');
  const banner = document.getElementById('installBanner');
  const textEl = document.getElementById('installBannerText');

  if (isRunningStandalone()) {
    // Already installed — never show the button
    return;
  }

  if (isIOS()) {
    // iOS Safari doesn't support beforeinstallprompt — show manual instructions instead
    textEl.innerHTML = '<strong>' + t('install.title') + '</strong><br>' + t('install.iosInstructions');
    installBtn.style.display = 'none';
    showInstallBanner();
  }

  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hideInstallBanner();
  });

  dismissBtn.addEventListener('click', hideInstallBanner);
});

// When the app is actually installed (whether via our button or the browser's own menu)
window.addEventListener('appinstalled', () => {
  hideInstallBanner();
  deferredInstallPrompt = null;
});
