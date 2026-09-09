const field = document.getElementById('apiBase');
const feedback = document.getElementById('ok');
const save = document.getElementById('save');
const show = (text, error = false) => {
  feedback.textContent = text;
  feedback.style.color = error ? '#9a2d24' : '#1d6b45';
  field.setAttribute('aria-invalid', String(error));
};
(async () => {
  try {
    const stored = await chrome.storage.sync.get(['apiBase']);
    field.value = globalThis.NasaqPrep.apiBase(stored.apiBase);
  } catch { show('تعذر قراءة الإعدادات. أغلق النافذة وافتحها مجددًا.', true); }
})();
save.addEventListener('click', async () => {
  save.disabled = true;
  try {
    const base = globalThis.NasaqPrep.apiBase(field.value);
    await chrome.storage.sync.set({ apiBase: base });
    field.value = base;
    show('تم الحفظ. حدّث الأسبوع في لوحة التحضير.');
  } catch (error) { show(error.message || 'تعذر حفظ الإعدادات.', true); }
  finally { save.disabled = false; }
});
