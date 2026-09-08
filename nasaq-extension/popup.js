const DEFAULT_API = 'https://api.nasaq.185.170.196.120.sslip.io';
const field = document.getElementById('apiBase');
const ok = document.getElementById('ok');

chrome.storage.sync.get(['apiBase'], ({ apiBase }) => {
  field.value = apiBase || DEFAULT_API;
});

document.getElementById('save').addEventListener('click', () => {
  const value = field.value.trim().replace(/\/+$/, '') || DEFAULT_API;
  chrome.storage.sync.set({ apiBase: value }, () => {
    ok.textContent = 'تم الحفظ';
    setTimeout(() => (ok.textContent = ''), 1600);
  });
});
