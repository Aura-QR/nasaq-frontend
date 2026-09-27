/* global importScripts */
importScripts('core.js');

// Credentials go only to our isolated content script, never to page scripts.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'NASAQ_SESSION') return false;
  (async () => {
    const url = new URL(sender.url || '');
    const trusted = url.origin === 'https://nasaqedu.org' ||
      (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname) &&
        ['5000', '5173'].includes(url.port));
    if (sender.id !== chrome.runtime.id || !sender.tab || !trusted)
      return { ok: false, status: 403, message: 'افتح الإضافة من صفحة نسق المعتمدة.' };
    const stored = await chrome.storage.sync.get(['apiBase']);
    const base = globalThis.NasaqPrep.apiBase(stored.apiBase);
    const cookie = await chrome.cookies.get({ url: url.href, name: '_auth',
      ...(sender.tab.cookieStoreId ? { storeId: sender.tab.cookieStoreId } : {}) });
    if (!cookie?.value) return globalThis.NasaqPrep.failure(401, { message: 'سجّل الدخول في نسق أولًا.' });
    return { ok: true, base, token: cookie.value, role: globalThis.NasaqPrep.sessionRole(cookie.value) };
  })().then(sendResponse).catch((error) => sendResponse({ ok: false, status: 0,
    message: error.message || 'تعذر قراءة إعدادات الإضافة. أعد تحميل الصفحة.' }));
  return true;
});
