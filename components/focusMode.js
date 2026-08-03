// ============================================================
// FOCUS MODE — a larger, distraction-free writing surface
// ============================================================
// Purely a UI layer on top of the existing notes field. It never
// introduces a new place where text is stored: everything typed here
// is mirrored live into `state.notes` (the same field the small
// textarea uses) and into the small textarea itself, so the two are
// always in sync and either one can be used interchangeably —
// nothing about the data model changes.
//
// Depends on: state, t(), updateWordMeter() and handleSaveButtonClick()
// from script.js (all available globally by the time this runs, since
// script.js loads after this file but these are only called from
// user-triggered event handlers, never at load time).

function openFocusMode() {
  const modal = document.getElementById('focusModal');
  const ta = document.getElementById('focusTextarea');
  ta.value = state.notes || '';
  modal.classList.add('show');
  updateFocusWordMeter();
  document.addEventListener('keydown', focusEscHandler);
  setTimeout(() => ta.focus(), 50);
}

function closeFocusMode() {
  const modal = document.getElementById('focusModal');
  if (!modal || !modal.classList.contains('show')) return;
  modal.classList.remove('show');
  document.removeEventListener('keydown', focusEscHandler);
}

function focusEscHandler(e) {
  if (e.key === 'Escape') closeFocusMode();
}

// Keeps the small Write-tab textarea (and the underlying state) in
// sync in real time while someone types in Focus mode.
function syncFocusToMain() {
  const text = document.getElementById('focusTextarea').value;
  state.notes = text;
  const mainTextarea = document.getElementById('notes');
  if (mainTextarea.value !== text) mainTextarea.value = text;
  if (typeof updateWordMeter === 'function') updateWordMeter();
  updateFocusWordMeter();
  if (typeof scheduleAutosave === 'function') scheduleAutosave();
}

function updateFocusWordMeter() {
  const text = (document.getElementById('focusTextarea').value || '').trim();
  const words = text.length ? text.split(/\s+/).filter(Boolean).length : 0;
  document.getElementById('focusWordCount').textContent = t('common.wordsCount', { count: words });
  document.getElementById('focusWordFill').style.width = Math.min(100, (words / 1000) * 100) + '%';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('focusModeBtn').addEventListener('click', openFocusMode);
  document.getElementById('focusCloseBtn').addEventListener('click', closeFocusMode);
  document.getElementById('focusTextarea').addEventListener('input', syncFocusToMain);
  document.getElementById('focusSaveBtn').addEventListener('click', () => handleSaveButtonClick());
});
