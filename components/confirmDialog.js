// ============================================================
// CONFIRM DIALOG — a small, reusable "are you sure?" modal
// ============================================================
// Generic on purpose: any destructive or important action anywhere
// in the app can call showConfirmDialog({...}) and await a boolean
// result, rather than every feature building its own yes/no modal.
// Currently used by entry deletion; safe to reuse for anything else
// added later.

function showConfirmDialog({ title, message, confirmLabel, cancelLabel, danger }) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title || '';
    document.getElementById('confirmMessage').textContent = message || '';
    const confirmBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');
    confirmBtn.textContent = confirmLabel || 'OK';
    cancelBtn.textContent = cancelLabel || 'Cancel';
    confirmBtn.className = 'confirm-btn' + (danger ? ' confirm-btn-danger' : '');

    modal.classList.add('show');

    function cleanup(result) {
      modal.classList.remove('show');
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    }
    function onConfirm() { cleanup(true); }
    function onCancel() { cleanup(false); }
    function onBackdrop(e) { if (e.target === modal) cleanup(false); }
    function onKey(e) { if (e.key === 'Escape') cleanup(false); if (e.key === 'Enter') cleanup(true); }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
    setTimeout(() => cancelBtn.focus(), 50); // default focus on the safe option
  });
}
