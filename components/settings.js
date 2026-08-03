// ============================================================
// SETTINGS — security (change PIN) and language switching
// ============================================================
// Lives in the Stats tab. Depends on: t()/setLanguage() from
// utils/i18n.js, and getSavedPin()/window.storage from script.js.
// Kept separate from script.js because it's a self-contained unit
// that doesn't touch any journal-entry state.

function renderPinChangeArea(mode) {
  const area = document.getElementById('pinChangeArea');
  if (mode !== 'editing') {
    area.innerHTML = '<button class="export-btn" id="startChangePinBtn">' + t('settings.changeCode') + '</button>';
    document.getElementById('startChangePinBtn').onclick = () => renderPinChangeArea('editing');
    return;
  }
  area.innerHTML = `
    <input type="password" class="plain" id="oldPinField" placeholder="${t('settings.currentCode')}" style="margin-bottom:10px;">
    <input type="password" class="plain" id="newPinField" placeholder="${t('lock.newCode')}" style="margin-bottom:10px;">
    <input type="password" class="plain" id="newPinField2" placeholder="${t('settings.confirmNewCode')}" style="margin-bottom:10px;">
    <div class="err" style="color:var(--rose); font-size:12.5px; min-height:16px; margin-bottom:8px;" id="pinChangeErr"></div>
    <button class="export-btn" id="confirmChangePinBtn">${t('settings.saveNewCode')}</button>
  `;
  const errEl = document.getElementById('pinChangeErr');
  document.getElementById('confirmChangePinBtn').onclick = async () => {
    const savedPin = await getSavedPin();
    const oldVal = document.getElementById('oldPinField').value;
    const newVal = document.getElementById('newPinField').value;
    const newVal2 = document.getElementById('newPinField2').value;
    if (oldVal !== savedPin) { errEl.textContent = t('settings.wrongCurrentCode'); return; }
    if (!newVal) { errEl.textContent = t('settings.enterNewCode'); return; }
    if (newVal !== newVal2) { errEl.textContent = t('lock.codesDontMatch'); return; }
    await window.storage.set('journal:pin', newVal);
    errEl.style.color = 'var(--sage)';
    errEl.textContent = t('settings.codeChanged');
    setTimeout(() => renderPinChangeArea(), 1200);
  };
}

function renderLanguageSwitcher() {
  const area = document.getElementById('languageSwitchArea');
  if (!area) return;
  const current = getLanguage();
  area.innerHTML =
    '<div class="stat-toggle">' +
      '<button data-lang="sv" class="' + (current === 'sv' ? 'active' : '') + '">🇸🇪 Svenska</button>' +
      '<button data-lang="en" class="' + (current === 'en' ? 'active' : '') + '">🇬🇧 English</button>' +
    '</div>';
  area.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => setLanguage(btn.dataset.lang);
  });
}
