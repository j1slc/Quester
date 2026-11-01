(function () {
  "use strict";

  function sendFinalize(msg) {
    if (typeof browser !== "undefined" && browser.runtime && browser.runtime.sendMessage) {
      return browser.runtime
        .sendMessage(msg)
        .catch((e) => ({ ok: false, status: 0, body: String((e && e.message) || e) }));
    }
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(msg, (resp) => {
        const err = chrome.runtime.lastError;
        resolve(err ? { ok: false, status: 0, body: err.message } : (resp || { ok: false, status: 0, body: "No response from background script" }));
      });
    });
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || e.origin !== location.origin) return;
    const d = e.data;
    if (!d || d.__mira !== true || d.type !== "finalize") return;

    sendFinalize({ type: "mira-finalize", appId: d.appId, userId: d.userId, botToken: d.botToken }).then((r) => {
      const rr = r || { ok: false, status: 0, body: "No response from background script" };
      window.postMessage(
        { __mira: true, type: "finalizeResult", id: d.id, ok: rr.ok, status: rr.status, body: rr.body },
        location.origin
      );
    });
  });
})();