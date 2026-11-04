/**
 * Test script for Discord Gateway badge spoofer
 * Run: node scripts/test-gateway.mjs [YOUR_TOKEN]
 *
 * Without a token: tests Gateway connection (HELLO handshake) + games CDN
 * With a token:    full end-to-end test (connects, identifies, sends presence for 3 games)
 */

import WebSocket from "ws";

const TOKEN = process.argv[2] || "";
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const GAMES_CDN_URL = "https://cdn.discordapp.com/detectables/games.json";

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

function pass(msg) { console.log(`  ${green("✅")} ${msg}`); }
function fail(msg) { console.log(`  ${red("❌")} ${msg}`); }
function info(msg) { console.log(`  ${cyan("ℹ")}  ${msg}`); }
function warn(msg) { console.log(`  ${yellow("⚠")}  ${msg}`); }

console.log(bold("\n══════════════════════════════════════════"));
console.log(bold("   Discord Gateway Badge Spoofer — Tests  "));
console.log(bold("══════════════════════════════════════════\n"));

// ── Test 1: Load games from Discord CDN ─────────────────────────────────────
async function testGamesLoad() {
  console.log(bold("Test 1: Discord Games CDN"));
  try {
    const start = Date.now();
    const res = await fetch(GAMES_CDN_URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      fail(`CDN responded with HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const elapsed = Date.now() - start;

    if (!Array.isArray(data)) {
      fail("Response is not an array");
      return null;
    }

    // Parse same as gateway.ts
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

    pass(`CDN loaded in ${elapsed}ms`);
    pass(`Total entries: ${data.length.toLocaleString()}`);
    pass(`Valid games (with Windows exe): ${games.length.toLocaleString()}`);
    info(`First game: "${games[0]?.name}" (id: ${games[0]?.id})`);
    info(`Last game:  "${games[games.length - 1]?.name}" (id: ${games[games.length - 1]?.id})`);

    return games;
  } catch (err) {
    fail(`Failed to load games: ${err.message}`);
    return null;
  }
}

// ── Test 2: Gateway HELLO handshake ─────────────────────────────────────────
async function testGatewayHello() {
  console.log(bold("\nTest 2: Gateway WebSocket — HELLO handshake"));
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      fail("Timed out waiting for HELLO (5s)");
      ws.terminate();
      resolve(false);
    }, 5000);

    const ws = new WebSocket(GATEWAY_URL);

    ws.on("error", (err) => {
      clearTimeout(timeout);
      fail(`WebSocket error: ${err.message}`);
      resolve(false);
    });

    ws.on("message", (data) => {
      let payload;
      try { payload = JSON.parse(data.toString()); } catch { return; }

      if (payload.op === 10) {
        clearTimeout(timeout);
        const interval = payload.d?.heartbeat_interval;
        pass(`Connected to Discord Gateway`);
        pass(`Received OP 10 (HELLO) — heartbeat_interval: ${interval}ms`);
        ws.close();
        resolve(true);
      }
    });

    ws.on("open", () => {
      info("WebSocket connection established");
    });
  });
}

// ── Test 3: Token validation ─────────────────────────────────────────────────
async function testToken(token) {
  console.log(bold("\nTest 3: Token Validation"));
  if (!token) {
    warn("No token provided — skipping (run with: node scripts/test-gateway.mjs YOUR_TOKEN)");
    return null;
  }

  try {
    const res = await fetch("https://discord.com/api/v9/users/@me", {
      headers: {
        authorization: token,
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 Electron/42.7.1 Safari/537.36",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 401) {
      fail("Token is INVALID or expired (401)");
      return null;
    }
    if (!res.ok) {
      fail(`Discord API error: ${res.status}`);
      return null;
    }

    const user = await res.json();
    pass(`Token is valid!`);
    pass(`Logged in as: ${user.global_name || user.username} (@${user.username})`);
    info(`User ID: ${user.id}`);
    return user;
  } catch (err) {
    fail(`Request failed: ${err.message}`);
    return null;
  }
}

// ── Test 4: Full Gateway presence spoof (3 games) ────────────────────────────
async function testGatewaySpoof(token, games) {
  console.log(bold("\nTest 4: Full Gateway Presence Spoof (3 games × 5 seconds)"));

  if (!token) {
    warn("No token provided — skipping");
    return;
  }
  if (!games || games.length === 0) {
    fail("No games available — skipping");
    return;
  }

  const testGames = games.slice(0, 3);
  const HOLD_MS = 5000; // 5 seconds for testing (real usage uses 35-60s)

  return new Promise((resolve) => {
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
      if (err) { fail(`Error: ${err.message}`); }
      resolve(!err);
    };

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
      info(`Sent presence for: "${game.name}" (id: ${game.id})`);
    };

    const scheduleNext = () => {
      if (finished) return;
      if (currentIdx >= testGames.length) {
        // Clear presence
        send({ op: 3, d: { since: null, activities: [], status: "online", afk: false } });
        setTimeout(() => {
          pass(`Presence cleared`);
          pass(`Successfully cycled through ${done} game(s)!`);
          finish();
        }, 500);
        return;
      }

      const game = testGames[currentIdx];
      sendPresence(game);
      gameTimer = setTimeout(() => {
        done++;
        pass(`Game ${done}/${testGames.length} done: "${game.name}"`);
        currentIdx++;
        scheduleNext();
      }, HOLD_MS);
    };

    // 60s overall timeout
    const globalTimeout = setTimeout(() => finish(new Error("Timed out")), 60_000);

    ws = new WebSocket(GATEWAY_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 Electron/42.7.1 Safari/537.36",
        "Accept-Language": "en-GB",
        Origin: "https://discord.com",
      },
    });

    ws.on("error", (err) => { clearTimeout(globalTimeout); finish(err); });
    ws.on("close", (code, reason) => {
      clearTimeout(globalTimeout);
      if (!finished) {
        // Discord close codes
        const codes = {
          4004: "Authentication failed — token is invalid",
          4005: "Already authenticated",
          4007: "Invalid sequence",
          4008: "Rate limited",
          4009: "Session timed out",
          4010: "Invalid shard",
          4011: "Sharding required",
          4012: "Invalid API version",
          4013: "Invalid intents",
          4014: "Disallowed intents",
        };
        const msg = codes[code] || `${code} ${reason.toString()}`;
        finish(new Error(`Closed: ${msg}`));
      }
    });

    ws.on("message", (data) => {
      let payload;
      try { payload = JSON.parse(data.toString()); } catch { return; }
      const { op, d, s, t } = payload;
      if (s != null) sequence = s;

      if (op === 10) {
        const interval = d.heartbeat_interval;
        pass(`Connected to Gateway (HELLO, interval: ${interval}ms)`);

        // Start heartbeat
        heartbeatTimer = setInterval(() => send({ op: 1, d: sequence }), interval);
        setTimeout(() => send({ op: 1, d: sequence }), Math.random() * interval);

        // Identify
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
              browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 Electron/42.7.1 Safari/537.36",
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
        info("Identify sent — waiting for READY...");
      }

      if (op === 0 && t === "READY") {
        pass(`Gateway READY! session_id: ${d.session_id?.slice(0, 12)}...`);
        info(`v=${d.v}, guilds: ${d.guilds?.length ?? 0}`);
        clearTimeout(globalTimeout);
        scheduleNext();
      }

      if (op === 7) {
        clearTimeout(globalTimeout);
        finish(new Error("Gateway requested RECONNECT — may be rate limited"));
      }
    });
  });
}

// ── Test 5: API endpoint ──────────────────────────────────────────────────────
async function testApiEndpoint(token) {
  console.log(bold("\nTest 5: /api/badges/spoof endpoint (HTTP)"));

  if (!token) {
    warn("No token provided — skipping");
    return;
  }

  try {
    info("Calling http://localhost:3000/api/badges/spoof ...");
    const res = await fetch("http://localhost:3000/api/badges/spoof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, mode: "variety", gameCount: 3 }),
      signal: AbortSignal.timeout(60_000),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      pass(`API responded: ${JSON.stringify(data)}`);
    } else {
      fail(`API error (${res.status}): ${JSON.stringify(data)}`);
    }
  } catch (err) {
    if (err.message.includes("ECONNREFUSED")) {
      warn("Dev server not running on :3000 — start it with: npm run dev");
    } else {
      fail(`Request failed: ${err.message}`);
    }
  }
}

// ── Run all tests ─────────────────────────────────────────────────────────────
(async () => {
  const games = await testGamesLoad();
  const helloOk = await testGatewayHello();
  const user = await testToken(TOKEN);
  await testGatewaySpoof(TOKEN, games);
  await testApiEndpoint(TOKEN);

  console.log(bold("\n══════════════════════════════════════════"));
  if (!TOKEN) {
    console.log(yellow("  ⚠  Run with token to test full flow:"));
    console.log(yellow("     node scripts/test-gateway.mjs YOUR_DISCORD_TOKEN"));
  } else {
    console.log(green("  All tests complete!"));
  }
  console.log(bold("══════════════════════════════════════════\n"));
  process.exit(0);
})();

