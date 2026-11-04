/**
 * Full badge spoof runner — runs entirely in Node.js, no browser needed.
 *
 * Usage:
 *   node scripts/spoof.mjs YOUR_TOKEN [mode] [gameCount]
 *
 * Modes:
 *   variety   — cycles many unique games (for Game Variety badge)
 *   playtime  — holds each game longer (for Game Time badge) [default]
 *
 * Examples:
 *   node scripts/spoof.mjs YOUR_TOKEN variety 500
 *   node scripts/spoof.mjs YOUR_TOKEN playtime 100
 */

import WebSocket from "ws";

const TOKEN = process.argv[2] || "";
const MODE = process.argv[3] || "playtime";
const GAME_COUNT = parseInt(process.argv[4] || "100", 10);

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const GAMES_CDN_URL = "https://cdn.discordapp.com/detectables/games.json";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
  "Electron/42.7.1 Safari/537.36";

// Time to hold each game presence (Discord needs ~30s minimum to register)
const HOLD_MS = MODE === "variety" ? 35_000 : 60_000;

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red   = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan  = (s) => `\x1b[36m${s}\x1b[0m`;
const yellow= (s) => `\x1b[33m${s}\x1b[0m`;
const bold  = (s) => `\x1b[1m${s}\x1b[0m`;

function pass(msg)  { console.log(`  ${green("✅")} ${msg}`); }
function fail(msg)  { console.log(`  ${red("❌")} ${msg}`); process.exit(1); }
function info(msg)  { console.log(`  ${cyan("›")}  ${msg}`); }
function warn(msg)  { console.log(`  ${yellow("⚠")}  ${msg}`); }

function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function bar(done, total, width = 30) {
  const filled = Math.round((done / total) * width);
  const empty = width - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${done}/${total}`;
}

// ── Load games ───────────────────────────────────────────────────────────────
async function loadGames() {
  process.stdout.write(`  ${cyan("›")}  تحميل قائمة الألعاب من Discord CDN... `);
  const res = await fetch(GAMES_CDN_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json();
  const games = [];
  const seen = new Set();
  for (const entry of data) {
    const gid = String(entry.id ?? "");
    if (!/^\d+$/.test(gid) || seen.has(gid)) continue;
    const winExe = (entry.executables ?? []).find((e) => e.os === "win32" && e.name);
    if (!winExe) continue;
    seen.add(gid);
    games.push({ id: gid, name: entry.name ?? "Unknown", exe: winExe.name });
  }
  console.log(green(`${games.length.toLocaleString()} لعبة ✅`));
  return games;
}

// ── Validate token ───────────────────────────────────────────────────────────
async function validateToken(token) {
  process.stdout.write(`  ${cyan("›")}  التحقق من التوكن... `);
  const res = await fetch("https://discord.com/api/v9/users/@me", {
    headers: { authorization: token, "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401) {
    console.log(red("❌"));
    fail("التوكن غير صالح أو منتهي الصلاحية");
  }
  if (!res.ok) {
    console.log(red("❌"));
    fail(`خطأ من Discord: ${res.status}`);
  }
  const user = await res.json();
  console.log(green(`✅ ${user.global_name || user.username} (@${user.username})`));
  return user;
}

// ── Run Gateway spoof ────────────────────────────────────────────────────────
function runSpoof(token, games) {
  return new Promise((resolve, reject) => {
    let ws;
    let heartbeatTimer;
    let gameTimer;
    let sequence = null;
    let currentIdx = 0;
    let done = 0;
    let finished = false;

    const cleanup = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (gameTimer) clearTimeout(gameTimer);
      if (ws) { try { ws.close(); } catch (_) {} }
    };

    const finish = (err) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (err) reject(err);
      else resolve(done);
    };

    // Handle Ctrl+C gracefully
    process.on("SIGINT", () => {
      console.log(`\n\n  ${yellow("⚠")}  توقف مبكر — تم إرسال ${done} لعبة`);
      finish();
      setTimeout(() => process.exit(0), 500);
    });

    const send = (payload) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    const sendPresence = (game) => {
      send({
        op: 3,
        d: {
          since: null,
          activities: [{
            name: game.name,
            type: 0,
            application_id: game.id,
            state: "In Game",
            details: null,
            timestamps: { start: Date.now() },
          }],
          status: "online",
          afk: false,
        },
      });
    };

    const scheduleNext = () => {
      if (finished) return;
      if (currentIdx >= games.length) {
        send({ op: 3, d: { since: null, activities: [], status: "online", afk: false } });
        setTimeout(() => {
          process.stdout.write("\r" + " ".repeat(80) + "\r");
          pass(`اكتمل! تم إرسال presence لـ ${done} لعبة بنجاح`);
          finish();
        }, 500);
        return;
      }

      const game = games[currentIdx];
      sendPresence(game);

      // Live progress bar
      const pct = Math.round((currentIdx / games.length) * 100);
      const eta = (games.length - currentIdx) * HOLD_MS;
      process.stdout.write(
        `\r  ${cyan("›")}  ${bar(currentIdx + 1, games.length)} ${pct}%  "${game.name.slice(0, 25)}"  ETA: ${formatTime(eta)}   `
      );

      gameTimer = setTimeout(() => {
        done++;
        currentIdx++;
        scheduleNext();
      }, HOLD_MS);
    };

    ws = new WebSocket(GATEWAY_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-GB",
        Origin: "https://discord.com",
      },
    });

    ws.on("error", (err) => finish(new Error(`WebSocket error: ${err.message}`)));

    ws.on("close", (code) => {
      if (!finished) {
        const codes = {
          4004: "فشل المصادقة — التوكن غير صالح",
          4008: "تجاوزت الحد المسموح به — انتظر دقيقة",
          4009: "انتهت الجلسة",
        };
        finish(new Error(codes[code] || `أُغلق الاتصال: كود ${code}`));
      }
    });

    ws.on("message", (data) => {
      let p;
      try { p = JSON.parse(data.toString()); } catch { return; }
      const { op, d, s, t } = p;
      if (s != null) sequence = s;

      if (op === 10) {
        heartbeatTimer = setInterval(() => send({ op: 1, d: sequence }), d.heartbeat_interval);
        setTimeout(() => send({ op: 1, d: sequence }), Math.random() * d.heartbeat_interval);

        send({
          op: 2,
          d: {
            token,
            capabilities: 30717,
            properties: {
              os: "Windows",
              browser: "Discord Client",
              release_channel: "stable",
              client_version: "1.0.9253",
              os_version: "10.0.26200",
              os_arch: "x64",
              app_arch: "x64",
              system_locale: "en-GB",
              browser_user_agent: USER_AGENT,
              browser_version: "42.7.1",
              client_build_number: 594031,
              native_build_number: 88414,
              client_event_source: null,
            },
            presence: { status: "online", since: 0, activities: [], afk: false },
            compress: false,
            client_state: { guild_versions: {} },
          },
        });
      }

      if (op === 0 && t === "READY") {
        pass(`متصل بـ Gateway (${d.session_id?.slice(0, 8)}...) — بدأ الإرسال...`);
        console.log();
        scheduleNext();
      }

      if (op === 7) finish(new Error("طلب Gateway إعادة الاتصال"));
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!TOKEN) {
    console.log(bold(red("\n  استخدام:")));
    console.log("  node scripts/spoof.mjs YOUR_TOKEN [variety|playtime] [gameCount]\n");
    console.log("  مثال (تنوع الألعاب):  node scripts/spoof.mjs TOKEN variety 500");
    console.log("  مثال (ساعات اللعب):   node scripts/spoof.mjs TOKEN playtime 100\n");
    process.exit(1);
  }

  console.log(bold(`\n${"═".repeat(52)}`));
  console.log(bold(`  Discord Badge Spoofer — Gateway Mode`));
  console.log(bold(`  الوضع: ${MODE === "variety" ? "تنوع الألعاب" : "ساعات اللعب"} | عدد الألعاب: ${GAME_COUNT} | ${formatTime(GAME_COUNT * HOLD_MS)} تقريباً`));
  console.log(bold(`${"═".repeat(52)}\n`));

  // Load games
  const allGames = await loadGames();
  const selected = allGames.slice(0, Math.min(GAME_COUNT, allGames.length));
  info(`سيتم إرسال presence لـ ${selected.length} لعبة، كل لعبة ${formatTime(HOLD_MS)}`);
  info(`الوقت المتوقع: ${formatTime(selected.length * HOLD_MS)}`);
  info(`اضغط Ctrl+C في أي وقت للإيقاف\n`);

  // Validate token
  await validateToken(TOKEN);
  console.log();

  // Run spoof
  const start = Date.now();
  try {
    const done = await runSpoof(TOKEN, selected);
    const elapsed = formatTime(Date.now() - start);
    console.log();
    console.log(bold(green(`\n  🎉 تم! ${done} لعبة في ${elapsed}`)));
    console.log(yellow(`  انتظر 24-48 ساعة وتحقق من حسابك على Discord\n`));
  } catch (err) {
    console.log();
    fail(err.message);
  }
})();

