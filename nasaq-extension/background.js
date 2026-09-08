/**
 * Every request to the Nasaq API.
 *
 * It lives here rather than in the content script for one reason: a content
 * script's fetch is bound by the page's CORS, so a call from the Nasaq site to
 * api.nasaq…  is a cross-origin request the browser will refuse. The service
 * worker is not — it has host_permissions, and those cover the API host.
 *
 * This file does nothing else. All the automation is in content.js, where it
 * can see what the teacher is looking at.
 */

const DEFAULTS = {
  apiBase: 'https://api.nasaq.185.170.196.120.sslip.io',
};

const settings = async () => {
  const stored = await chrome.storage.sync.get(['apiBase']);
  return { ...DEFAULTS, ...stored };
};

/**
 * The session, taken from the site the teacher is already signed in to.
 *
 * The frontend stores its JWT in a cookie named `_auth` (js-cookie, so not
 * HttpOnly). Reading it means the extension never asks anyone for a password
 * and never holds one: when the teacher signs out of Nasaq, this stops working
 * too, which is the behaviour you want.
 */
async function readToken(pageUrl) {
  try {
    const url = new URL(pageUrl);
    const cookie = await chrome.cookies.get({
      url: `${url.protocol}//${url.host}`,
      name: '_auth',
    });
    return cookie?.value || '';
  } catch {
    return '';
  }
}

async function call({ method = 'GET', path, body, pageUrl }) {
  const { apiBase } = await settings();
  const token = await readToken(pageUrl);

  if (!token) {
    return { ok: false, status: 401, message: 'سجّل الدخول في نسق أولًا' };
  }

  try {
    const response = await fetch(`${apiBase.replace(/\/+$/, '')}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || payload?.status === false) {
      return {
        ok: false,
        status: response.status,
        // The API says why in Arabic; passing our own words over it would
        // hide the one useful sentence.
        message: payload?.message || `تعذر الاتصال (${response.status})`,
      };
    }

    return {
      ok: true,
      data: payload?.data ?? payload,
      pagination: payload?.pagination ?? null,
      message: payload?.message ?? '',
    };
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      message: timedOut ? 'انتهت مهلة الاتصال بنسق' : 'تعذر الوصول إلى نسق',
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'NASAQ_API') return false;

  call({ ...message, pageUrl: message.pageUrl || sender?.tab?.url || '' })
    .then(sendResponse)
    .catch((error) =>
      sendResponse({ ok: false, status: 0, message: String(error?.message || error) }),
    );

  return true; // keep the channel open for the async reply
});
