// ============================================================
// ONBOARDING — shown once, the very first time the app is opened
// ============================================================
// A small self-contained step flow: choose language -> optional name
// -> create a lock code -> done. It only depends on the i18n engine
// and window.storage, so it can be reused or restyled independently
// of the rest of the app.
//
// Usage: renderOnboarding(containerEl, onComplete)
// onComplete is called once the user finishes the last step.

function renderOnboarding(container, onComplete) {
  let step = 0;
  let profileName = '';

  function stepDots() {
    let dots = '<div class="onboarding-dots">';
    for (let i = 0; i < 4; i++) dots += '<span class="ob-dot' + (i === step ? ' active' : '') + '"></span>';
    return dots + '</div>';
  }

  function renderStep() {
    if (step === 0) renderLanguageStep();
    else if (step === 1) renderNameStep();
    else if (step === 2) renderPinStep();
    else renderDoneStep();
  }

  function renderLanguageStep() {
    container.innerHTML =
      '<div class="icon">🌍</div>' +
      '<h2>' + t('onboarding.welcomeTitle') + '</h2>' +
      '<p class="sub" style="margin-bottom:18px;">' + t('onboarding.welcomeSub') + '</p>' +
      '<div class="lang-choice">' +
        '<button class="lang-btn" data-lang="sv">🇸🇪 Svenska</button>' +
        '<button class="lang-btn" data-lang="en">🇬🇧 English</button>' +
      '</div>' + stepDots();
    container.querySelectorAll('.lang-btn').forEach(btn => {
      btn.onclick = async () => { await setLanguage(btn.dataset.lang); step = 1; renderStep(); };
    });
  }

  function renderNameStep() {
    container.innerHTML =
      '<div class="icon">👋</div>' +
      '<h2>' + t('onboarding.stepName') + '</h2>' +
      '<input type="text" class="plain" id="obName" placeholder="' + t('onboarding.namePlaceholder') + '" style="margin-bottom:8px; text-align:center;">' +
      '<p class="sub" style="margin-bottom:16px;">' + t('onboarding.skipName') + '</p>' +
      '<button class="export-btn" id="obNameNext">' + t('onboarding.continueBtn') + '</button>' + stepDots();
    const input = document.getElementById('obName');
    setTimeout(() => input.focus(), 100);
    const next = async () => {
      profileName = input.value.trim();
      if (profileName) { try { await window.storage.set('app:profileName', profileName); } catch (e) { /* non-fatal */ } }
      step = 2; renderStep();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') next(); });
    document.getElementById('obNameNext').onclick = next;
  }

  function renderPinStep() {
    container.innerHTML =
      '<div class="icon">🔐</div>' +
      '<h2>' + t('onboarding.stepPin') + '</h2>' +
      '<p class="sub" style="margin-bottom:14px;">' + t('onboarding.stepPinSub') + '</p>' +
      '<input type="password" id="obPin1" placeholder="' + t('lock.newCode') + '" style="margin-bottom:10px;"><br>' +
      '<input type="password" id="obPin2" placeholder="' + t('lock.confirmCode') + '">' +
      '<div class="err" id="obPinErr"></div>' + stepDots();
    const pin1 = document.getElementById('obPin1');
    const pin2 = document.getElementById('obPin2');
    const err = document.getElementById('obPinErr');
    const submit = async () => {
      if (!pin1.value) { err.textContent = t('lock.enterCodeFirst'); return; }
      if (pin1.value !== pin2.value) { err.textContent = t('lock.codesDontMatch'); pin2.value = ''; pin2.focus(); return; }
      await window.storage.set('journal:pin', pin1.value);
      step = 3; renderStep();
    };
    pin1.addEventListener('keydown', (e) => { if (e.key === 'Enter') pin2.focus(); });
    pin2.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    setTimeout(() => pin1.focus(), 100);
  }

  function renderDoneStep() {
    const greetName = profileName ? ', ' + profileName : '';
    container.innerHTML =
      '<div class="icon">🎉</div>' +
      '<h2>' + t('onboarding.welcomeTitle') + greetName + '</h2>' +
      '<p class="sub" style="margin-bottom:18px;">' + t('onboarding.doneSub') + '</p>' +
      '<button class="export-btn" id="obFinish">' + t('onboarding.finishBtn') + '</button>' + stepDots();
    document.getElementById('obFinish').onclick = onComplete;
  }

  renderStep();
}
