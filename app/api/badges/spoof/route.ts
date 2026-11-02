import { NextResponse } from "next/server";

/**
 * Badge Spoofer API – Posts launch_game + running_game_heartbeat events
 * to Discord's /api/v9/science endpoint (the same endpoint the real client
 * uses to credit playtime badges).
 *
 * This mirrors the approach from revere-group/discord-badge-spoofer, adapted
 * to run server-side as a Next.js route.
 */

const SCIENCE_URL = "https://discord.com/api/v9/science";
const ME_URL = "https://discord.com/api/v9/users/@me?with_analytics_token=true";
const PROPERTIES_URL = "https://cordapi.dolfi.es/api/v2/properties/windows";
const GAMES_CDN_URL = "https://cdn.discordapp.com/detectables/games.json";

const CLIENT_VERSION = "1.0.9253";
const CLIENT_BUILD_NUMBER = 594031;
const NATIVE_BUILD_NUMBER = 88414;
const OS_VERSION = "10.0.26200";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
  "Electron/42.7.1 Safari/537.36";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;

// ── helpers ──

function uuid(): string {
  return crypto.randomUUID();
}

function localProps(): Record<string, unknown> {
  return {
    os: "Windows",
    browser: "Discord Client",
    release_channel: "stable",
    client_version: CLIENT_VERSION,
    os_version: OS_VERSION,
    os_arch: "x64",
    app_arch: "x64",
    system_locale: "en-GB",
    has_client_mods: false,
    browser_user_agent: USER_AGENT,
    browser_version: "42.7.1",
    os_sdk_version: "26200",
    client_build_number: CLIENT_BUILD_NUMBER,
    native_build_number: NATIVE_BUILD_NUMBER,
    client_event_source: null,
    client_app_state: "focused",
  };
}

async function buildSuperProps(launchSig: string, hbSession: string): Promise<string> {
  let props: Record<string, unknown>;
  try {
    const res = await fetch(PROPERTIES_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": USER_AGENT },
      body: "{}",
      signal: AbortSignal.timeout(10_000),
    });
    const json = await res.json();
    props = json.properties ?? localProps();
  } catch {
    props = localProps();
  }
  props.client_launch_id = uuid();
  props.launch_signature = launchSig;
  props.client_heartbeat_session_id = hbSession;
  return Buffer.from(JSON.stringify(props)).toString("base64");
}

async function fetchAnalyticsToken(token: string, superProps: string): Promise<string> {
  const res = await fetch(ME_URL, {
    headers: {
      authorization: token,
      "user-agent": USER_AGENT,
      "x-super-properties": superProps,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`token rejected (${res.status})`);
  const data = await res.json();
  if (!data.analytics_token) throw new Error("no analytics_token in response");
  return data.analytics_token;
}

interface Game {
  id: string;
  name: string;
  exe: string;
}

async function loadGames(): Promise<Game[]> {
  const res = await fetch(GAMES_CDN_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(30_000),
  });
  const data: any[] = await res.json();
  const games: Game[] = [];
  const seen = new Set<string>();
  for (const entry of data) {
    const gid = String(entry.id ?? "");
    if (!/^\d+$/.test(gid) || seen.has(gid)) continue;
    const winExe = (entry.executables ?? []).find(
      (e: any) => e.os === "win32" && e.name
    );
    if (!winExe) continue;
    seen.add(gid);
    games.push({ id: gid, name: entry.name ?? "Unknown", exe: winExe.name });
  }
  return games;
}

// ── event builders ──

let seq = 0;
function nextSeq(): number {
  return ++seq;
}

function buildLaunch(
  game: Game,
  hbSession: string,
  launchSig: string,
  isStreaming: boolean = false
): Record<string, unknown> {
  const now = Date.now();
  return {
    type: "launch_game",
    properties: {
      client_track_timestamp: now,
      client_heartbeat_session_id: hbSession,
      event_sequence_number: nextSeq(),
      game: game.name,
      game_id: game.id,
      verified: true,
      elevated: false,
      is_launcher: false,
      game_platform: "desktop",
      detection_method: "verified_game",
      is_overlay_enabled: false,
      is_overlay_game_enabled: true,
      is_overlay_game_source: "OOP_DEFAULT_DATABASE",
      fullscreen_type: "UNKNOWN",
      hardware_display_count: 1,
      overlay_method: "Disabled",
      activity_status_enabled: true,
      activity_status_shared_guilds: [],
      current_user_status: "online",
      game_detection_enabled: true,
      executable_path: game.exe,
      voice_channel_id: isStreaming ? "112233445566778899" : null,
      voice_channel_type: isStreaming ? 2 : null,
      voice_channel_bitrate: isStreaming ? 64000 : null,
      voice_channel_guild_id: isStreaming ? "998877665544332211" : null,
      hidden_by_distributor: false,
      game_metadata: null,
      client_performance_cpu: null,
      client_performance_memory: null,
      cpu_core_count: null,
      accessibility_features: 0,
      rendered_locale: "en-GB",
      launch_signature: launchSig,
      client_rtc_state: isStreaming ? "connected" : null,
      client_app_state: "focused",
      client_send_timestamp: now,
    },
  };
}

function buildHeartbeat(
  game: Game,
  durationMs: number,
  sessionId: string,
  initial: boolean,
  final: boolean,
  hbSession: string,
  launchSig: string,
  ts?: number,
  mediaSessionId?: string | null,
  rtcId?: string | null
): Record<string, unknown> {
  const t = ts ?? Date.now();
  return {
    type: "running_game_heartbeat",
    properties: {
      client_track_timestamp: t,
      client_heartbeat_session_id: hbSession,
      event_sequence_number: nextSeq(),
      game_id: game.id,
      game_name: game.name,
      game_metadata: null,
      game_executable: game.exe,
      game_detection_enabled: true,
      initial_heartbeat: initial,
      final_heartbeat: final,
      game_session_id: sessionId,
      duration_tracked_ms: durationMs,
      rtc_connection_id: rtcId ?? null,
      media_session_id: mediaSessionId ?? null,
      launch_signature: launchSig,
      client_app_state: "focused",
      client_send_timestamp: t,
    },
  };
}

function buildSession(
  game: Game,
  durationMs: number,
  hbSession: string,
  launchSig: string,
  isStreaming: boolean = false
): Record<string, unknown>[] {
  const sid = uuid();
  const mediaSessionId = isStreaming ? uuid() : null;
  const rtcId = isStreaming ? uuid() : null;
  const now = Date.now();
  const start = Math.max(0, now - durationMs) || now;
  return [
    buildHeartbeat(game, 0, sid, true, false, hbSession, launchSig, start, mediaSessionId, rtcId),
    buildLaunch(game, hbSession, launchSig, isStreaming),
    buildHeartbeat(game, durationMs, sid, false, true, hbSession, launchSig, now, mediaSessionId, rtcId),
  ];
}

async function postScience(
  events: Record<string, unknown>[],
  analyticsToken: string,
  accountToken: string,
  cookie: string | undefined,
  superProps: string
): Promise<number> {
  const payload = { token: analyticsToken, events };
  const headers: Record<string, string> = {
    accept: "*/*",
    "accept-language": "en-GB",
    authorization: accountToken,
    "content-type": "application/json",
    origin: "https://discord.com",
    referer: "https://discord.com/channels/@me",
    "user-agent": USER_AGENT,
    "x-debug-options": "bugReporterEnabled",
    "x-discord-locale": "en-GB",
    "x-discord-timezone": "Europe/Oslo",
    "x-super-properties": superProps,
  };

  if (cookie && cookie.trim()) {
    headers.cookie = cookie.trim();
  }

  const res = await fetch(SCIENCE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  return res.status;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── route handler ──

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, cookie, mode, gameCount, hoursPerGame } = body as {
      token?: string;
      cookie?: string;
      mode?: "playtime" | "variety" | "streaming";
      gameCount?: number;
      hoursPerGame?: number;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }
    const cookieVal = typeof cookie === "string" ? cookie.trim() : undefined;

    // Reset sequence counter per request
    seq = 0;

    // Build session identity
    const hbSession = uuid();
    const launchSig = uuid();
    const superProps = await buildSuperProps(launchSig, hbSession);

    // Fetch analytics token
    let analyticsToken: string;
    try {
      analyticsToken = await fetchAnalyticsToken(token.trim(), superProps);
    } catch (err: any) {
      return NextResponse.json(
        { error: `فشل التحقق: ${err.message}` },
        { status: 401 }
      );
    }

    // Load games
    const allGames = await loadGames();
    if (allGames.length === 0) {
      return NextResponse.json(
        { error: "فشل تحميل قائمة الألعاب من ديسكورد" },
        { status: 500 }
      );
    }

    const spoofMode = mode ?? "playtime";
    const count = Math.min(gameCount ?? allGames.length, allGames.length);
    const hours = hoursPerGame ?? (spoofMode === "streaming" ? 5000 : 1);
    const selectedGames = allGames.slice(0, count);

    let durationMs: number;
    if (spoofMode === "variety") {
      // Mark games as played with 1 minute each
      durationMs = 60_000;
    } else {
      durationMs = Math.round(hours * 3600 * 1000);
    }

    const isStreaming = spoofMode === "streaming";

    // Send in batches
    let sentOk = 0;
    let lastStatus = 204;
    for (let i = 0; i < selectedGames.length; i += BATCH_SIZE) {
      const chunk = selectedGames.slice(i, i + BATCH_SIZE);
      const events: Record<string, unknown>[] = [];
      for (const game of chunk) {
        events.push(...buildSession(game, durationMs, hbSession, launchSig, isStreaming));
      }
      const status = await postScience(events, analyticsToken, token.trim(), cookieVal, superProps);
      lastStatus = status;
      if (status === 204) {
        sentOk += chunk.length;
      } else if (status === 401 || status === 403) {
        return NextResponse.json(
          {
            error: `رفض المصادقة (${status}) — حدّث الكوكي وأعد المحاولة`,
            sentGames: sentOk,
            totalGames: selectedGames.length,
          },
          { status: 403 }
        );
      }
      if (i + BATCH_SIZE < selectedGames.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    return NextResponse.json({
      success: true,
      sentGames: sentOk,
      totalGames: selectedGames.length,
      totalHours: spoofMode === "variety" ? 0 : sentOk * hours,
      mode: spoofMode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}

