/**
 * Client-Side Discord Gateway Spoofer
 * Runs directly in the browser via native WebSocket.
 * Immune to Vercel/serverless timeouts because it maintains
 * a direct WebSocket connection between the browser and Discord.
 */

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const GAMES_CDN_URL = "https://cdn.discordapp.com/detectables/games.json";

export interface GatewayGame {
  id: string;
  name: string;
  exe: string;
}

export interface ClientSpoofProgress {
  current: number;
  total: number;
  gameName: string;
  secondsRemaining: number;
}

export interface ClientSpoofOptions {
  token: string;
  games: GatewayGame[];
  holdSeconds?: number;
  onProgress?: (p: ClientSpoofProgress) => void;
  onComplete?: (totalDone: number) => void;
  onError?: (err: string) => void;
}

export async function fetchDiscordGames(): Promise<GatewayGame[]> {
  const res = await fetch(GAMES_CDN_URL);
  if (!res.ok) throw new Error("تعذر تحميل قائمة الألعاب من ديسكورد");
  const data: any[] = await res.json();
  const games: GatewayGame[] = [];
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

export class ClientGatewaySpoofer {
  private ws: WebSocket | null = null;
  private heartbeatInterval: any = null;
  private tickerInterval: any = null;
  private gameTimeout: any = null;
  private sequence: number | null = null;
  private isStopped = false;
  private doneCount = 0;

  stop() {
    this.isStopped = true;
    this.cleanup();
  }

  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    if (this.gameTimeout) clearTimeout(this.gameTimeout);
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          // Clear presence before closing
          this.ws.send(
            JSON.stringify({
              op: 3,
              d: { since: null, activities: [], status: "online", afk: false },
            })
          );
        }
        this.ws.close();
      } catch (_) {
        /* ignore */
      }
      this.ws = null;
    }
  }

  start(opts: ClientSpoofOptions) {
    const { token, games, holdSeconds = 35, onProgress, onComplete, onError } = opts;
    this.isStopped = false;
    this.doneCount = 0;

    if (!games || games.length === 0) {
      onError?.("قائمة الألعاب فارغة");
      return;
    }

    try {
      this.ws = new WebSocket(GATEWAY_URL);
    } catch (err: any) {
      onError?.(`فشل فتح اتصال WebSocket: ${err.message}`);
      return;
    }

    const send = (payload: object) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload));
      }
    };

    const sendPresence = (game: GatewayGame) => {
      send({
        op: 3,
        d: {
          since: null,
          activities: [
            {
              name: game.name,
              type: 0, // Playing
              application_id: game.id,
              state: "In Game",
              details: null,
              timestamps: { start: Date.now() },
            },
          ],
          status: "online",
          afk: false,
        },
      });
    };

    let currentGameIdx = 0;

    const playNextGame = () => {
      if (this.isStopped) return;

      if (currentGameIdx >= games.length) {
        this.cleanup();
        onComplete?.(this.doneCount);
        return;
      }

      const game = games[currentGameIdx];
      sendPresence(game);

      let remaining = holdSeconds;
      onProgress?.({
        current: currentGameIdx + 1,
        total: games.length,
        gameName: game.name,
        secondsRemaining: remaining,
      });

      if (this.tickerInterval) clearInterval(this.tickerInterval);
      this.tickerInterval = setInterval(() => {
        if (this.isStopped) return;
        remaining--;
        onProgress?.({
          current: currentGameIdx + 1,
          total: games.length,
          gameName: game.name,
          secondsRemaining: Math.max(0, remaining),
        });
      }, 1000);

      if (this.gameTimeout) clearTimeout(this.gameTimeout);
      this.gameTimeout = setTimeout(() => {
        if (this.isStopped) return;
        if (this.tickerInterval) clearInterval(this.tickerInterval);
        this.doneCount++;
        currentGameIdx++;
        playNextGame();
      }, holdSeconds * 1000);
    };

    this.ws.onopen = () => {
      // Waiting for OP 10 (HELLO)
    };

    this.ws.onerror = () => {
      if (!this.isStopped) {
        onError?.("حدث خطأ أثناء الاتصال بسيرفر ديسكورد Gateway");
        this.cleanup();
      }
    };

    this.ws.onclose = (event) => {
      if (this.isStopped) return;
      this.cleanup();

      const CLOSE_CODES: Record<number, string> = {
        4004: "التوكن غير صالح أو انتهت صلاحيته",
        4008: "تم تجاوز الحد المسموح به — انتظر دقيقة وأعد المحاولة",
        4009: "انتهت الجلسة — أعد المحاولة",
      };

      const msg = CLOSE_CODES[event.code] || `انقطع الاتصال (${event.code})`;
      if (this.doneCount > 0) {
        onComplete?.(this.doneCount);
      } else {
        onError?.(msg);
      }
    };

    this.ws.onmessage = (event) => {
      if (this.isStopped) return;
      let payload: any;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      const { op, d, s, t } = payload;
      if (s != null) this.sequence = s;

      if (op === 10) {
        // HELLO: Heartbeat setup
        const interval = d.heartbeat_interval;
        this.heartbeatInterval = setInterval(() => {
          send({ op: 1, d: this.sequence });
        }, interval);

        // Send IDENTIFY
        send({
          op: 2,
          d: {
            token: token.trim().replace(/^["']|["']$/g, ""),
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
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 Electron/42.7.1 Safari/537.36",
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
        // READY! Start cycling games
        playNextGame();
      }

      if (op === 1) {
        send({ op: 1, d: this.sequence });
      }

      if (op === 7) {
        this.cleanup();
        onError?.("طلب سيرفر ديسكورد إعادة الاتصال — يرجى المحاولة لاحقاً");
      }
    };
  }
}
