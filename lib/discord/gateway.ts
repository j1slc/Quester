/**
 * Discord Gateway WebSocket client for spoofing game presence.
 *
 * Discord credits Game Time & Game Variety badges by tracking
 * rich presence (game activity) sent over the WebSocket Gateway.
 * The /api/v9/science endpoint is analytics-only and does NOT
 * credit badges.
 *
 * This module connects to the Discord Gateway as a self-bot,
 * identifies, then repeatedly sends OP 3 (Status Update) with
 * game presence data to simulate playing each game.
 */

import WebSocket from "ws";

// Discord Gateway constants
const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

// Gateway opcodes
const OP = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  STATUS_UPDATE: 3,
  RESUME: 6,
  RECONNECT: 7,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
} as const;

export interface GatewayGame {
  id: string;
  name: string;
  exe: string;
}

export interface GatewayOptions {
  token: string;
  games: GatewayGame[];
  /** milliseconds to hold each game's presence before switching */
  holdMs?: number;
  /** called with progress updates */
  onProgress?: (done: number, total: number, gameName: string) => void;
  /** signal to abort early */
  signal?: AbortSignal;
}

type ResolveType = (value: { done: number; total: number }) => void;
type RejectType = (reason: Error) => void;

/**
 * Connects to Discord Gateway, identifies as the user, then cycles
 * through each game sending a presence update and holding it for
 * `holdMs` milliseconds before moving to the next.
 *
 * Returns when all games have been cycled through.
 */
export function runGatewaySpoof(opts: GatewayOptions): Promise<{ done: number; total: number }> {
  const { token, games, holdMs = 35_000, onProgress, signal } = opts;

  return new Promise<{ done: number; total: number }>((resolve: ResolveType, reject: RejectType) => {
    if (games.length === 0) {
      resolve({ done: 0, total: 0 });
      return;
    }

    let ws: WebSocket | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let gameTimer: ReturnType<typeof setTimeout> | null = null;
    let sessionId: string | null = null;
    let sequence: number | null = null;
    let currentGameIdx = 0;
    let done = 0;
    let finished = false;

    const cleanup = () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (gameTimer) clearTimeout(gameTimer);
      if (ws) {
        try { ws.close(); } catch (_) { /* ignore */ }
        ws = null;
      }
    };

    const finish = (err?: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (err) reject(err);
      else resolve({ done, total: games.length });
    };

    // Abort support
    if (signal) {
      signal.addEventListener("abort", () => finish(new Error("Aborted")));
    }

    // Send JSON payload to gateway
    const send = (payload: object) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    // Send OP 3 presence update for the given game
    const sendPresence = (game: GatewayGame) => {
      send({
        op: OP.STATUS_UPDATE,
        d: {
          since: null,
          activities: [
            {
              name: game.name,
              type: 0,          // 0 = Playing
              application_id: game.id,
              state: "In Game",
              details: null,
              timestamps: {
                start: Date.now(),
              },
            },
          ],
          status: "online",
          afk: false,
        },
      });
    };

    // Clear presence (send empty activities)
    const clearPresence = () => {
      send({
        op: OP.STATUS_UPDATE,
        d: {
          since: null,
          activities: [],
          status: "online",
          afk: false,
        },
      });
    };

    // Schedule the next game
    const scheduleNext = () => {
      if (finished) return;

      if (currentGameIdx >= games.length) {
        // All done — clear presence and finish
        clearPresence();
        setTimeout(() => finish(), 500);
        return;
      }

      const game = games[currentGameIdx];
      sendPresence(game);

      gameTimer = setTimeout(() => {
        done++;
        onProgress?.(done, games.length, game.name);
        currentGameIdx++;
        scheduleNext();
      }, holdMs);
    };

    // Connect
    ws = new WebSocket(GATEWAY_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
          "Electron/42.7.1 Safari/537.36",
        "Accept-Language": "en-GB",
        Origin: "https://discord.com",
      },
    });

    ws.on("error", (err: Error) => {
      finish(new Error(`WebSocket error: ${err.message}`));
    });

    ws.on("close", (code: number, reason: Buffer) => {
      if (!finished) {
        const CLOSE_CODES: Record<number, string> = {
          4004: "فشل المصادقة — التوكن غير صالح أو منتهي الصلاحية",
          4005: "تمت المصادقة بالفعل",
          4007: "تسلسل غير صالح",
          4008: "تجاوزت الحد المسموح به — انتظر دقيقة وأعد المحاولة",
          4009: "انتهت الجلسة — أعد المحاولة",
          4010: "shared غير صالح",
          4011: "يتطلب shared",
          4012: "إصدار API غير صالح",
          4013: "صلاحيات غير صحيحة",
          4014: "صلاحيات محظورة",
        };
        const msg = CLOSE_CODES[code] || `أُغلق الاتصال بكود ${code}: ${reason.toString()}`;
        finish(new Error(msg));
      }
    });

    ws.on("message", (data: WebSocket.RawData) => {
      let payload: { op: number; d: any; s?: number; t?: string };
      try {
        payload = JSON.parse(data.toString());
      } catch {
        return;
      }

      const { op, d, s } = payload;
      if (s != null) sequence = s;

      switch (op) {
        case OP.HELLO: {
          // Start heartbeat
          const interval: number = d.heartbeat_interval;
          heartbeatTimer = setInterval(() => {
            send({ op: OP.HEARTBEAT, d: sequence });
          }, interval);

          // Send initial heartbeat immediately (jittered)
          setTimeout(() => send({ op: OP.HEARTBEAT, d: sequence }), Math.random() * interval);

          // Identify
          send({
            op: OP.IDENTIFY,
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
                browser_user_agent:
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                  "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
                  "Electron/42.7.1 Safari/537.36",
                browser_version: "42.7.1",
                client_build_number: 594031,
                native_build_number: 88414,
                client_event_source: null,
              },
              presence: {
                status: "online",
                since: 0,
                activities: [],
                afk: false,
              },
              compress: false,
              client_state: {
                guild_versions: {},
              },
            },
          });
          break;
        }

        case OP.DISPATCH: {
          const { t } = payload;
          if (t === "READY") {
            sessionId = d.session_id;
            // Start cycling through games
            scheduleNext();
          }
          break;
        }

        case OP.RECONNECT: {
          finish(new Error("Gateway requested reconnect — rate limited or session invalidated"));
          break;
        }

        case OP.HEARTBEAT: {
          send({ op: OP.HEARTBEAT, d: sequence });
          break;
        }
      }
    });
  });
}

