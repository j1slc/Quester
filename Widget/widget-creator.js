(function () {
  "use strict";

  if (!location.hostname.endsWith("discord.com")) return;
  if (window.__miraWidgetLoaded) return;
  window.__miraWidgetLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let lastApp = null;
  const WIDGET_EXPERIMENT = "2026-03-widget-config-editor";
  let overrideApplied = false;

  // Reworked UI Logic
  const UI = (function () {
    const PREFIX = "mira";
    const COLORS = { info: "#94a3b8", step: "#a855f7", success: "#10b981", warn: "#f59e0b", error: "#ef4444" };

    let logEl, startBtn, fallbackWrap, fallbackText, statusEl, jsonEl, targetEl;
    let running = false;

    function injectStyles() {
      if (document.getElementById(`${PREFIX}-styles`)) return;
      const css = `
        #${PREFIX}-launcher { position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
          background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #fff; border: none; border-radius: 12px;
          padding: 12px 20px; font: 600 13px/1 "JetBrains Mono", system-ui, sans-serif; cursor: pointer;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4); transition: transform 0.2s element, box-shadow 0.2s; border: 1px solid rgba(255,255,255,0.1); }
        #${PREFIX}-launcher:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(168, 85, 247, 0.6); }
        
        #${PREFIX}-panel { position: fixed; right: 24px; bottom: 24px; z-index: 2147483647; width: 480px;
          max-width: calc(100vw - 48px); background: #0b0f19; color: #f1f5f9; border: 1px solid #1e293b;
          border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.75);
          font: 13px/1.5 "system-ui", sans-serif; display: none; overflow: hidden; }
        #${PREFIX}-panel.${PREFIX}-open { display: block; }
        
        #${PREFIX}-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #020617; border-bottom: 1px solid #1e293b; cursor: move; user-select: none; }
        #${PREFIX}-head .${PREFIX}-title { font-family: "JetBrains Mono", monospace; font-weight: 700; flex: 1; letter-spacing: 0.5px; background: linear-gradient(90deg, #c084fc, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        #${PREFIX}-head .${PREFIX}-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
        #${PREFIX}-head button { background: transparent; border: none; color: #64748b; cursor: pointer; font-size: 18px; line-height: 1; padding: 2px 8px; border-radius: 6px; transition: background 0.2s, color 0.2s; }
        #${PREFIX}-head button:hover { background: #1e293b; color: #fff; }
        
        #${PREFIX}-tabs-nav { display: flex; background: #090d16; border-bottom: 1px solid #1e293b; padding: 4px 8px 0; }
        .${PREFIX}-tab-btn { background: transparent; border: none; color: #64748b; padding: 8px 16px; cursor: pointer; font-size: 12px; font-weight: 600; border-radius: 8px 8px 0 0; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .${PREFIX}-tab-btn:hover { color: #f1f5f9; background: #111827; }
        .${PREFIX}-tab-btn.${PREFIX}-active-tab { color: #a855f7; border-bottom-color: #a855f7; background: #0b0f19; }
        
        .${PREFIX}-tab-content { display: none; padding: 14px; }
        .${PREFIX}-tab-content.${PREFIX}-active-content { display: block; }
        
        #${PREFIX}-note { padding: 10px 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; margin-bottom: 12px; color: #fbbf24; font-size: 12px; }
        
        #${PREFIX}-log { height: 200px; overflow: auto; padding: 12px; border-radius: 8px; font-family: "JetBrains Mono", monospace; font-size: 12px; white-space: pre-wrap; background: #020617; border: 1px solid #1e293b; }
        #${PREFIX}-log div { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.01); }
        
        #${PREFIX}-json { width: 100%; height: 90px; box-sizing: border-box; resize: vertical; background: #020617; color: #e2e8f0; border: 1px solid #1e293b; border-radius: 8px; padding: 10px; font-family: "JetBrains Mono", monospace; font-size: 11px; }
        #${PREFIX}-json:focus { border-color: #a855f7; outline: none; }
        
        #${PREFIX}-target-row { display: flex; gap: 8px; margin-top: 10px; }
        #${PREFIX}-target { flex: 1; background: #020617; color: #f1f5f9; border: 1px solid #1e293b; border-radius: 8px; padding: 8px; font-size: 12px; cursor: pointer; }
        #${PREFIX}-load { background: #1e293b; color: #f1f5f9; border: 1px solid #334155; border-radius: 8px; padding: 8px 14px; font-weight: 600; cursor: pointer; font-size: 12px; transition: background 0.2s; }
        #${PREFIX}-load:hover { background: #334155; }
        
        #${PREFIX}-tools-bar { display: flex; gap: 8px; margin-top: 10px; }
        #${PREFIX}-tools-bar button { flex: 1; border: none; border-radius: 8px; padding: 9px; font-weight: 600; cursor: pointer; font-size: 12px; background: #1e293b; color: #fff; transition: background 0.2s; }
        #${PREFIX}-tools-bar button:hover { background: #334155; }
        #${PREFIX}-tools-bar #${PREFIX}-export { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
        #${PREFIX}-tools-bar #${PREFIX}-export:hover { filter: brightness(1.1); }
        
        #${PREFIX}-fallback { display: none; padding: 12px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; margin-top: 12px; }
        #${PREFIX}-fallback.${PREFIX}-open { display: block; }
        #${PREFIX}-fallback p { margin: 0 0 8px; color: #f87171; font-size: 12px; font-weight: 500; }
        #${PREFIX}-fallback textarea { width: 100%; height: 80px; box-sizing: border-box; resize: none; background: #020617; color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 8px; font-family: "JetBrains Mono", monospace; font-size: 11px; }
        #${PREFIX}-copy { margin-top: 8px; background: #ef4444; color: #fff; border: none; border-radius: 8px; padding: 8px 14px; font-weight: 600; cursor: pointer; }
        
        #${PREFIX}-bar { display: flex; gap: 10px; padding: 12px 16px; background: #020617; border-top: 1px solid #1e293b; align-items: center; }
        #${PREFIX}-bar .${PREFIX}-status { flex: 1; color: #94a3b8; font-family: "JetBrains Mono", monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        #${PREFIX}-bar button { border: none; border-radius: 8px; padding: 9px 16px; font-weight: 600; cursor: pointer; font-size: 13px; transition: all 0.2s; }
        #${PREFIX}-start { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #fff; box-shadow: 0 0 12px rgba(168,85,247,0.3); }
        #${PREFIX}-start:hover { filter: brightness(1.1); box-shadow: 0 0 16px rgba(168,85,247,0.5); }
        #${PREFIX}-clear { background: #1e293b; color: #94a3b8; }
        #${PREFIX}-clear:hover { background: #334155; color: #fff; }
        #${PREFIX}-tab { background: #1e293b; color: #c084fc; border: 1px solid rgba(168,85,247,0.2); }
        #${PREFIX}-tab:hover { background: rgba(168,85,247,0.1); }
        button:disabled, select:disabled, textarea:disabled { opacity: 0.4 !important; cursor: not-allowed !important; box-shadow: none !important; filter: none !important; }
      `;
      const style = document.createElement("style");
      style.id = `${PREFIX}-styles`;
      style.textContent = css;
      document.head.appendChild(style);
    }

    function build() {
      injectStyles();

      const launcher = document.createElement("button");
      launcher.id = `${PREFIX}-launcher`;
      launcher.textContent = "M.I.R.A Widget";
      launcher.addEventListener("click", () => { panel.classList.add(`${PREFIX}-open`); launcher.style.display = "none"; });

      const panel = document.createElement("div");
      panel.id = `${PREFIX}-panel`;
      panel.innerHTML = `
        <div id="${PREFIX}-head">
          <span class="${PREFIX}-dot"></span>
          <span class="${PREFIX}-title">M.I.R.A // WIDGET ENGINE</span>
          <button id="${PREFIX}-min" title="Minimize">—</button>
        </div>
        <div id="${PREFIX}-tabs-nav">
          <button class="${PREFIX}-tab-btn ${PREFIX}-active-tab" data-tab="automation">Automation</button>
          <button class="${PREFIX}-tab-btn" data-tab="io">Data Exchange (JSON)</button>
        </div>
        
        <!-- Tab 1: Automation -->
        <div id="${PREFIX}-tab-automation" class="${PREFIX}-tab-content ${PREFIX}-active-content">
          <div id="${PREFIX}-note">🛡 Generates custom application profiles automatically. Handle any required captchas or verification prompts safely via the native Discord user interface.</div>
          <div id="${PREFIX}-log"></div>
          <div id="${PREFIX}-fallback">
            <p>Direct finalization block intercepted. Run the following deployment script inside a local terminal pipeline (PowerShell):</p>
            <textarea id="${PREFIX}-fallback-text" readonly></textarea>
            <button id="${PREFIX}-copy">Copy Command Pipeline</button>
          </div>
        </div>
        
        <!-- Tab 2: IO Structure -->
        <div id="${PREFIX}-tab-io" class="${PREFIX}-tab-content">
          <textarea id="${PREFIX}-json" placeholder='Paste widget structure JSON configuration here...'></textarea>
          <div id="${PREFIX}-target-row">
            <select id="${PREFIX}-target">
              <option value="new">➕ Create New Profile Layout</option>
            </select>
            <button id="${PREFIX}-load">⟳ Fetch Apps</button>
          </div>
          <div id="${PREFIX}-tools-bar">
            <button id="${PREFIX}-export">⬇ Export Active</button>
            <button id="${PREFIX}-import">⬆ Import Context</button>
            <button id="${PREFIX}-refresh">↻ Hot Reload</button>
          </div>
        </div>
        
        <div id="${PREFIX}-bar">
          <span class="${PREFIX}-status" id="${PREFIX}-status">SYSTEM IDLE</span>
          <button id="${PREFIX}-tab">Fix Tab</button>
          <button id="${PREFIX}-clear">Clear</button>
          <button id="${PREFIX}-start">▶ Initialize</button>
        </div>`;

      document.body.appendChild(launcher);
      document.body.appendChild(panel);

      logEl = panel.querySelector(`#${PREFIX}-log`);
      startBtn = panel.querySelector(`#${PREFIX}-start`);
      statusEl = panel.querySelector(`#${PREFIX}-status`);
      jsonEl = panel.querySelector(`#${PREFIX}-json`);
      targetEl = panel.querySelector(`#${PREFIX}-target`);
      fallbackWrap = panel.querySelector(`#${PREFIX}-fallback`);
      fallbackText = panel.querySelector(`#${PREFIX}-fallback-text`);

      // Modern Tab Navigation
      panel.querySelectorAll(`.${PREFIX}-tab-btn`).forEach(btn => {
        btn.addEventListener("click", () => {
          panel.querySelectorAll(`.${PREFIX}-tab-btn`).forEach(b => b.classList.remove(`${PREFIX}-active-tab`));
          panel.querySelectorAll(`.${PREFIX}-tab-content`).forEach(c => c.classList.remove(`${PREFIX}-active-content`));
          btn.classList.add(`${PREFIX}-active-tab`);
          panel.querySelector(`#${PREFIX}-tab-${btn.dataset.tab}`).classList.add(`${PREFIX}-active-content`);
        });
      });

      panel.querySelector(`#${PREFIX}-min`).addEventListener("click", () => { panel.classList.remove(`${PREFIX}-open`); launcher.style.display = ""; });
      panel.querySelector(`#${PREFIX}-clear`).addEventListener("click", () => { logEl.innerHTML = ""; fallbackWrap.classList.remove(`${PREFIX}-open`); });
      panel.querySelector(`#${PREFIX}-copy`).addEventListener("click", () => copyFallback());

      makeDraggable(panel, panel.querySelector(`#${PREFIX}-head`));
      log("M.I.R.A Framework Online. Ready for identity compilation.", "info");
    }

    function makeDraggable(el, handle) {
      let sx, sy, ox, oy, dragging = false;
      handle.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "BUTTON") return;
        dragging = true;
        const r = el.getBoundingClientRect();
        ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
        el.style.right = "auto"; el.style.bottom = "auto"; el.style.left = ox + "px"; el.style.top = oy + "px";
        e.preventDefault();
      });
      document.addEventListener("mousemove", (e) => {
        if (!dragging) return;
        el.style.left = ox + (e.clientX - sx) + "px";
        el.style.top = oy + (e.clientY - sy) + "px";
      });
      document.addEventListener("mouseup", () => { dragging = false; });
    }

    function log(msg, level = "info") {
      const line = document.createElement("div");
      line.style.color = COLORS[level] || COLORS.info;
      line.textContent = `[${new Date().toLocaleTimeString()}] [${level.toUpperCase()}] ${msg}`;
      if (logEl) { logEl.appendChild(line); logEl.scrollTop = logEl.scrollHeight; }
      console.log(`[M.I.R.A] ${msg}`);
    }

    function setStatus(text) { if (statusEl) statusEl.textContent = text; }
    function setRunning(state) {
      running = state;
      if (startBtn) { startBtn.disabled = state; startBtn.textContent = state ? "COMPILING…" : "▶ Initialize"; }
      ["export", "import", "refresh", "tab", "load", "target"].forEach((id) => {
        const b = document.getElementById(`${PREFIX}-${id}`);
        if (b) b.disabled = state;
      });
    }
    function isRunning() { return running; }
    function getJson() { return jsonEl ? jsonEl.value : ""; }
    function setJson(t) { if (jsonEl) jsonEl.value = t; }
    function getTarget() { return targetEl ? targetEl.value : "new"; }
    function setTargetOptions(apps) {
      if (!targetEl) return;
      const current = targetEl.value;
      while (targetEl.options.length > 1) targetEl.remove(1);
      apps.forEach((a) => {
        const o = document.createElement("option");
        o.value = a.id;
        o.textContent = `⚙ ${a.name || "App"} [${a.id}]`;
        targetEl.appendChild(o);
      });
      if ([].some.call(targetEl.options, (o) => o.value === current)) targetEl.value = current;
    }

    function showFallback(command) {
      if (!fallbackWrap) return;
      fallbackText.value = command;
      fallbackWrap.classList.add(`${PREFIX}-open`);
    }
    async function copyFallback() {
      const btn = document.getElementById(`${PREFIX}-copy`);
      try {
        await navigator.clipboard.writeText(fallbackText.value);
        if (btn) { btn.textContent = "Copied to Clipboard!"; setTimeout(() => (btn.textContent = "Copy Command Pipeline"), 1500); }
      } catch (e) {
        fallbackText.focus(); fallbackText.select();
        if (btn) { btn.textContent = "Press Ctrl+C"; setTimeout(() => (btn.textContent = "Copy Command Pipeline"), 2000); }
      }
    }

    return { build, log, setStatus, setRunning, isRunning, getJson, setJson, getTarget, setTargetOptions, showFallback, onStart: (h) => startBtn.addEventListener("click", () => { if (!running) h(); }), bindButton: (id, h) => document.getElementById(`${PREFIX}-${id}`)?.addEventListener("click", h) };
  })();

  // Automation logic matching exactly the previous execution loops[cite: 4]
  function buildSurfaces() {
    const stats = {};
    for (let i = 1; i <= 6; i++) {
      stats[`stat_${i}`] = {
        fields: {
          value: { presentation_type: "text", value_type: "custom_string", value: `text ${i} here` },
          label: { presentation_type: "text", value_type: "custom_string", value: `label ${i} here` },
        },
      };
    }
    return {
      surfaces: {
        widget_top: { layout: "widget_top_hero", components: { hero_image: { fields: { image: { presentation_type: "image", value_type: "data", value: "change this to an image" } } }, title: { fields: { text: { presentation_type: "text", value_type: "custom_string", value: "some title here" } } } } },
        widget_bottom: { layout: "widget_bottom_stats", components: stats },
        add_widget_preview: { layout: "add_widget_preview_hero", components: { hero_image: { fields: { image: { presentation_type: "image", value_type: "data", value: "change this to an image" } } } } },
      },
    };
  }

  function buildPowershell(appId, userId, botToken) {
    const body = JSON.stringify({ data: { dynamic: [] } });
    return `Invoke-RestMethod -Method PATCH -Headers @{"Content-Type"="application/json"; "Authorization"="Bot ${botToken}";"User-Agent"="DiscordBot (https://github.com/discord/discord-api-docs, 1.0.0)"} -Uri https://discord.com/api/v9/applications/${appId}/users/${userId}/identities/0/profile -Body '${body}'`;
  }

  function currentAppId() {
    const m = location.pathname.match(/\/applications\/(\d+)/);
    return m ? m[1] : null;
  }

  function extractSurfacesBody(json) {
    if (!json || typeof json !== "object") return null;
    if (json.surfaces && typeof json.surfaces === "object") return { surfaces: json.surfaces };
    const surfaceKeys = ["widget_top", "widget_bottom", "add_widget_preview"];
    if (surfaceKeys.some((k) => k in json)) return { surfaces: json };
    return null;
  }

  function readJsonBox() {
    const raw = UI.getJson().trim();
    if (!raw) { UI.log("Target input vector is empty.", "warn"); return null; }
    try { return JSON.parse(raw); }
    catch (e) { UI.log("Malformed JSON structure parsing failure: " + e.message, "error"); return null; }
  }

  function describeErr(e) {
    if (!e) return "unknown matrix fault";
    let s = "";
    if (e.status) s += "HTTP " + e.status;
    if (e.body) { try { s += " " + JSON.stringify(e.body); } catch (x) {} }
    else if (e.message) s += (s ? " " : "") + e.message;
    return s || String(e);
  }

  function walkAssetFields(node, cb) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { for (const item of node) walkAssetFields(item, cb); return; }
    if (node.value_type === "application_asset" && typeof node.value === "string" && node.value) { cb(node); return; }
    for (const key of Object.keys(node)) walkAssetFields(node[key], cb);
  }

  function collectAssetNames(surfaces) {
    const names = new Set();
    walkAssetFields(surfaces, (n) => names.add(n.value));
    return names;
  }

  function remapSurfaceAssets(surfaces, remap) {
    if (!remap || !Object.keys(remap).length) return surfaces;
    const clone = JSON.parse(JSON.stringify(surfaces));
    walkAssetFields(clone, (n) => { if (remap[n.value] != null) n.value = remap[n.value]; });
    return clone;
  }

  function assetName(a) { return a ? (a.key != null ? a.key : a.name) : undefined; }
  function assetId(a) { return a ? (a.asset_id != null ? a.asset_id : a.id) : undefined; }
  function extForContentType(ct) { return ct === "image/jpeg" ? "jpg" : ct === "image/gif" ? "gif" : ct === "image/webp" ? "webp" : "png"; }
  function blobToDataUrl(blob) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error("binary block read err")); fr.readAsDataURL(blob); }); }

  async function fetchAssetDataUrl(appId, id, contentType) {
    const ext = extForContentType(contentType);
    const res = await fetch(`https://cdn.discordapp.com/app-assets/${appId}/${id}.${ext}`, { credentials: "omit" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return blobToDataUrl(await res.blob());
  }

  function getInternals() {
    if (typeof window.webpackChunkdiscord_developers === "undefined") {
      throw new Error("Webpack context intercept failed. Navigate to developers application dashboard.");
    }
    const wpRequire = window.webpackChunkdiscord_developers.push([["mira_" + Math.random()], {}, (r) => r]);
    window.webpackChunkdiscord_developers.pop();
    const find = (pred, name) => {
      const mod = Object.values(wpRequire.c).find(pred);
      if (!mod) throw new Error(`Link mapping failed for structural layout component: ${name}`);
      return mod;
    };
    return {
      ApexStore: find((x) => x?.exports?.A?.createOverride, "ApexStore").exports.A,
      UserStore: find((x) => x?.exports?.A?.__proto__?.getCurrentUser, "UserStore").exports.A,
      FluxDispatcher: find((x) => x?.exports?.A?.__proto__?.flushWaitQueue, "FluxDispatcher").exports.A,
      api: find((x) => x?.exports?.Bo?.get, "API module").exports.Bo,
    };
  }

  async function apiCall(api, method, opts, label) {
    UI.log(label + " ongoing...", "step");
    try { return await api[method](opts); } catch (e) {
      let d = ""; if (e?.status) d += ` HTTP ${e.status}`; if (e?.body) { try { d += " " + JSON.stringify(e.body); } catch (x) {} } else if (e?.message) d += " " + e.message;
      const err = new Error(`${label} terminated: ${d || " " + String(e)}`); err.cause = e; throw err;
    }
  }

  async function fetchConfig(api, appId) {
    const listRes = await apiCall(api, "get", { url: `/applications/${appId}/widget-configs` }, "Fetching widget configs");
    let b = listRes.body;
    let cfg = Array.isArray(b) ? b[0] : (b && Array.isArray(b.configs) ? b.configs[0] : b);
    if (cfg && cfg.config_id && !cfg.surfaces) {
      try { const full = await apiCall(api, "get", { url: `/applications/${appId}/widget-configs/${cfg.config_id}` }, "Fetching detailed layout definitions"); cfg = full.body || cfg; } catch (e) {}
    }
    return cfg;
  }

  async function getAppAssets(api, appId) {
    const paths = [`/applications/${appId}/assets`, `/oauth2/applications/${appId}/assets`];
    let lastErr;
    for (const url of paths) { try { const res = await api.get({ url }); const b = res?.body; return Array.isArray(b) ? b : (b?.assets || []); } catch (e) { lastErr = e; } }
    throw lastErr || new Error("Asset structural configuration readout failure");
  }

  async function uploadAsset(api, appId, name, dataUrl, contentType) {
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const ext = extForContentType(contentType || blob.type);
    const slotRes = await api.post({ url: `/applications/${appId}/assets/upload`, body: { filename: `${name}.${ext}`, file_size: blob.size } });
    const slot = slotRes?.body; if (!slot?.upload_url) throw new Error("Upload initialization handoff dropped");
    await fetch(slot.upload_url, { method: "PUT", body: blob });
    const regRes = await api.post({ url: `/applications/${appId}/assets`, body: { key: name, upload_filename: slot.upload_filename, visibility: "public" } });
    return regRes?.body;
  }

  function bridgeFinalize(appId, userId, botToken) {
    return new Promise((resolve) => {
      const id = "mira-" + Math.random().toString(36).slice(2);
      const timer = setTimeout(() => { window.removeEventListener("message", onMsg); resolve({ ok: false, status: 0, body: "M.I.R.A Bridge runtime handoff timeout" }); }, 20000);
      function onMsg(e) {
        if (e.source !== window) return; const d = e.data; if (!d || d.__mira !== true || d.type !== "finalizeResult" || d.id !== id) return;
        clearTimeout(timer); window.removeEventListener("message", onMsg); resolve({ ok: !!d.ok, status: d.status, body: d.body });
      }
      window.addEventListener("message", onMsg);
      window.postMessage({ __mira: true, type: "finalize", id, appId, userId, botToken }, location.origin);
    });
  }

  async function runFlow(opts) {
    if (UI.isRunning()) return; UI.setRunning(true); UI.setStatus("PROCESSING");
    try { await createWidget(opts || {}); UI.setStatus("SUCCESS"); } catch (err) {
      UI.log(`FATAL COMPILATION CRASH: ${err?.message || err}`, "error");
      const body = err?.body || err?.cause?.body; if (body) { try { UI.log("Matrix response: " + JSON.stringify(body), "error"); } catch (e) {} }
      UI.setStatus("CRASHED");
    } finally { UI.setRunning(false); }
  }

  async function createWidget(opts) {
    UI.log("Binding core memory internals...", "step");
    const { ApexStore, UserStore, FluxDispatcher, api } = getInternals();
    const userId = UserStore.getCurrentUser().id;
    UI.log(`Core execution scope mapped to user: ${userId}.`, "info");

    const displayName = opts.displayName || "M.I.R.A Core Layer";
    const surfacesBody = opts.surfaces || buildSurfaces();

    const appRes = await apiCall(api, "post", { url: "/applications", body: { name: "M.I.R.A Terminal Module", team_id: null } }, "Provisioning remote workspace allocation app");
    FluxDispatcher.dispatch({ type: "APPLICATION_CREATE_SUCCESS", application: appRes.body });
    const appId = appRes.body.id; UI.log(`Application vector linked: [${appId}].`, "success");

    await apiCall(api, "post", {
      url: `/applications/${appId}/social-sdk/enable`,
      body: { name: "a", business_email: "mira@interface.io", game_or_studio_name: "a", game_or_studio_url: "", email_updates_consent: false, country_or_region: "United States", title_role: "Founder", target_platforms: [], form_type: "Dev Solutions", sfdc_leadsource: "Dev Portal", utm_campaign: "SDK Enable Form" },
    }, "Activating structural sub-layer SDK bindings");

    const configRes = await apiCall(api, "post", { url: `/applications/${appId}/widget-configs`, body: { display_name: displayName } }, "Generating design canvas configurations");
    const configId = configRes.body.config_id; lastApp = { appId, configId };
    let layoutBody = surfacesBody;
    if (opts.assets) { const remap = await materializeAssets(api, appId, opts.assets); layoutBody = { surfaces: remapSurfaceAssets(surfacesBody.surfaces, remap) }; }
    await apiCall(api, "patch", { url: `/applications/${appId}/widget-configs/${configId}`, body: layoutBody }, "Injecting structural telemetry parameters");
    await apiCall(api, "post", { url: `/applications/${appId}/widget-configs/${configId}/publish` }, "Broadcasting config mapping across public scope");

    await apiCall(api, "patch", { url: `/applications/${appId}`, body: { redirect_uris: ["https://discord.com"] } }, "Adjusting data sync loops");
    await apiCall(api, "post", { url: `/oauth2/authorize?client_id=${appId}&response_type=token&scope=sdk.social_layer_presence`, body: { authorize: true } }, "Injecting cryptographic structural authorizations");
    const profileRes = await apiCall(api, "get", { url: `/users/${userId}/profile` }, "Evaluating global identity tree maps");
    const existingWidgets = profileRes.body.widgets || []; existingWidgets.unshift({ data: { type: "application", application_id: appId } });
    await apiCall(api, "put", { url: `/users/@me/widgets`, body: { widgets: existingWidgets } }, "Linking application nodes inside structural context map");

    const botTokenRes = await apiCall(api, "post", { url: `/applications/${appId}/bot/reset` }, "Minting authorization validation certificate");
    const botToken = botTokenRes.body.token;

    const result = await bridgeFinalize(appId, userId, botToken);
    if (result.ok) { UI.log("Identity finalized automatically. System optimized. ✔", "success"); }
    else { UI.log(`Pipeline routing structural block encountered: HTTP ${result.status}`, "error"); UI.showFallback(buildPowershell(appId, userId, botToken)); }

    try {
      ApexStore.createOverride(WIDGET_EXPERIMENT, 1); overrideApplied = true;
      document.querySelector(`a[href="/developers/applications/${appId}"]`)?.click();
      for (let i = 0; i < 50 && !document.querySelector(`a[href="/developers/applications/${appId}/widget"]`); i++) await sleep(100);
      document.querySelector(`a[href="/developers/applications/${appId}/widget"]`)?.click();
      UI.log("Custom development environment generated cleanly.", "success");
    } catch (e) { UI.log(`Dynamic visual sidebar render failed: ${e.message}`, "warn"); }
  }

  async function applyToApp(api, appId, body, assets) {
    let configId = (lastApp && lastApp.appId === appId) ? lastApp.configId : null;
    if (!configId) { const cfg = await fetchConfig(api, appId); configId = cfg?.config_id; }
    if (!configId) { const configRes = await apiCall(api, "post", { url: `/applications/${appId}/widget-configs`, body: { display_name: "M.I.R.A Module Layout" } }, "Provisioning design allocation structural setup context"); configId = configRes.body.config_id; }
    lastApp = { appId, configId };
    let outBody = body; if (assets && Object.keys(assets).length) { const remap = await materializeAssets(api, appId, assets); outBody = { surfaces: remapSurfaceAssets(body.surfaces, remap) }; }
    await apiCall(api, "patch", { url: `/applications/${appId}/widget-configs/${configId}`, body: outBody }, "Transmitting update vectors");
    await apiCall(api, "post", { url: `/applications/${appId}/widget-configs/${configId}/publish` }, "Syncing broadcast matrix");
  }

  async function materializeAssets(api, appId, assets) {
    const names = assets ? Object.keys(assets) : []; if (!names.length) return null;
    UI.log(`Uploading layout image configurations...`, "step");
    let existing = []; try { existing = await getAppAssets(api, appId); } catch (e) {}
    const existingByName = new Map(existing.map((a) => [assetName(a), a]));
    const remap = {};
    for (const name of names) {
      if (existingByName.has(name)) { remap[name] = name; continue; }
      const entry = assets[name]; const image = typeof entry === "string" ? entry : entry?.image;
      if (!image) continue;
      try { const asset = await uploadAsset(api, appId, name, image, entry?.content_type || null); remap[name] = assetName(asset) || name; } catch (e) {}
    }
    return remap;
  }

  async function exportWidget() {
    if (UI.isRunning()) return; UI.setRunning(true); UI.setStatus("EXPORTING");
    try {
      const { api } = getInternals(); const appId = currentAppId() || lastApp?.appId;
      if (!appId) throw new Error("Context tracking lost. Access an application workspace view first.");
      const cfg = await fetchConfig(api, appId); if (!cfg?.surfaces) throw new Error("Workspace allocation has empty layout properties.");
      const envelope = { _type: "mira-widget", version: 2, display_name: cfg.display_name || "M.I.R.A Layout", surfaces: cfg.surfaces };
      const names = collectAssetNames(cfg.surfaces);
      if (names.size) {
        let list = []; try { list = await getAppAssets(api, appId); } catch (e) {}
        const byName = new Map(list.map((a) => [assetName(a), a])); const bundle = {};
        for (const name of names) {
          const asset = byName.get(name); const aid = assetId(asset);
          if (aid) try { bundle[name] = { asset_type: asset.asset_type ?? "image", content_type: asset.metadata?.content_type || "image/png", image: await fetchAssetDataUrl(appId, aid, asset.metadata?.content_type) }; } catch (e) {}
        }
        if (Object.keys(bundle).length) envelope.assets = bundle;
      }
      UI.setJson(JSON.stringify(envelope, null, 2)); UI.log("Identity footprint schema packed into output matrix.", "success");
      UI.setStatus("EXPORTED");
    } catch (err) { UI.log(`Export processing drop: ${err?.message || err}`, "error"); UI.setStatus("FAILED"); } finally { UI.setRunning(false); }
  }

  async function loadWidgetList() {
    if (UI.isRunning()) return; UI.setRunning(true); UI.setStatus("FETCHING");
    try {
      const { api } = getInternals(); const res = await apiCall(api, "get", { url: "/applications" }, "Scanning account context workspace tree nodes");
      const raw = Array.isArray(res.body) ? res.body : (res.body?.applications || []);
      const apps = raw.filter((a) => a && a.id).map((a) => ({ id: a.id, name: a.name })); UI.setTargetOptions(apps);
      UI.log(`Loaded [${apps.length}] valid target profiles into select buffer dropdown grid matching account records.`, "success");
      UI.setStatus("IDLE");
    } catch (err) { UI.log(`Scan dropped down loop failure: ${err?.message || err}`, "error"); UI.setStatus("FAILED"); } finally { UI.setRunning(false); }
  }

  function boot() {
    UI.build();
    UI.onStart(() => runFlow({}));
    UI.bindButton("export", exportWidget);
    UI.bindButton("load", loadWidgetList);
    UI.bindButton("import", () => {
      if (UI.isRunning()) return; const json = readJsonBox(); if (!json) return; const body = extractSurfacesBody(json); if (!body) return;
      const target = UI.getTarget(); if (target === "new") runFlow({ surfaces: body, displayName: json.display_name, assets: json.assets });
      else (async () => { UI.setRunning(true); UI.setStatus("UPDATING"); try { const { api } = getInternals(); await applyToApp(api, target, body, json.assets); UI.log("Target layout parameters re-aligned successfully.", "success"); UI.setStatus("UPDATED"); } catch (e) { UI.log("Context structural sync error: " + describeErr(e), "error"); UI.setStatus("FAILED"); } finally { UI.setRunning(false); } })();
    });
    UI.bindButton("refresh", async () => {
      if (UI.isRunning()) return; const json = readJsonBox(); if (!json) return; const body = extractSurfacesBody(json); if (!body) return;
      UI.setRunning(true); UI.setStatus("REFRESHING");
      try { const { api } = getInternals(); const appId = currentAppId() || lastApp?.appId; if (!appId) throw new Error("No active targeted allocation tracking link bound."); await applyToApp(api, appId, body, json.assets); UI.log("Layout parameters context hot-reloaded safely.", "success"); UI.setStatus("SYNCED"); } catch (e) { UI.log("Hot reload flash dropped: " + describeErr(e), "error"); UI.setStatus("FAILED"); } finally { UI.setRunning(false); }
    });
    UI.bindButton("tab", async () => {
      try { const { ApexStore } = getInternals(); ApexStore.createOverride(WIDGET_EXPERIMENT, 1); UI.log("Layout tab override forced cleanly.", "success"); } catch (e) { UI.log("Structural memory flag assignment failure.", "warn"); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();