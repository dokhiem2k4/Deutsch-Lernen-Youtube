import { proxyFetch, type SmApiRequest, type SmApiResponse } from "../lib/apiExt";
import { refreshSession, SESSION_STORAGE_KEY, type ExtSession } from "../lib/supabaseExt";

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Deutsch Lernen] service worker installed");
});

async function getSession(): Promise<ExtSession | null> {
  const o = await chrome.storage.local.get(SESSION_STORAGE_KEY);
  return (o[SESSION_STORAGE_KEY] as ExtSession) ?? null;
}
async function setSession(s: ExtSession | null): Promise<void> {
  if (s) await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: s });
  else await chrome.storage.local.remove(SESSION_STORAGE_KEY);
}

// SM_API: proxy fetch tới API web bằng Bearer; 401 → refresh 1 lần → retry; fail → logout.
async function handleApi(msg: SmApiRequest): Promise<SmApiResponse> {
  const session = await getSession();
  if (!session) return { ok: false, status: 401, error: "no_session" };

  let res = await proxyFetch(msg.method, msg.path, msg.body, session.access_token);
  if (res.status === 401 && session.refresh_token) {
    const refreshed = await refreshSession(session.refresh_token);
    if (refreshed) {
      await setSession(refreshed);
      res = await proxyFetch(msg.method, msg.path, msg.body, refreshed.access_token);
    } else {
      await setSession(null); // refresh fail → coi như đăng xuất
    }
  }
  return res;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;

  switch (msg.type) {
    case "SM_SESSION": // auth-bridge forward session từ web
      setSession((msg.session as ExtSession) ?? null).then(() => sendResponse({ ok: true }));
      return true;
    case "SM_LOGOUT":
      setSession(null).then(() => sendResponse({ ok: true }));
      return true;
    case "SM_API":
      handleApi(msg as SmApiRequest).then(sendResponse);
      return true;
    default:
      return false;
  }
});
