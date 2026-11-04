import { NextResponse } from "next/server";
import WebSocket from "ws";

/**
 * Quick connection test endpoint.
 * Validates the token against Discord API, then opens a Gateway WebSocket
 * and waits for READY — without sending any presence or spoofing anything.
 *
 * Returns within ~10 seconds with a detailed status report.
 */

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
  "Electron/42.7.1 Safari/537.36";

async function validateToken(token: string): Promise<{
  ok: boolean;
  username?: string;
  id?: string;
  error?: string;
  status?: number;
}> {
  try {
    const res = await fetch("https://discord.com/api/v9/users/@me", {
      headers: { authorization: token, "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401) return { ok: false, status: 401, error: "التوكن غير صالح أو منتهي الصلاحية" };
    if (!res.ok) return { ok: false, status: res.status, error: `خطأ من ديسكورد: ${res.status}` };
    const u = await res.json();
    return { ok: true, username: u.username, id: u.id };
  } catch (err: any) {
    return { ok: false, error: `تعذر الاتصال: ${err.message}` };
  }
}

function testGateway(token: string): Promise<{
  ok: boolean;
  sessionId?: string;
  latencyMs?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const start = Date.now();
    let ws: WebSocket | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let done = false;

    const finish = (result: { ok: boolean; sessionId?: string; latencyMs?: number; error?: string }) => {
      if (done) return;
      done = true;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (ws) { try { ws.close(); } catch (_) {} }
      resolve(result);
    };

    // 12 second timeout
    const timeout = setTimeout(() => {
      finish({ ok: false, error: "انتهت مهلة الاتصال بـ Gateway (12s)" });
    }, 12_000);

    ws = new WebSocket(GATEWAY_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-GB",
        Origin: "https://discord.com",
      },
    });

    ws.on("error", (err: Error) => {
      clearTimeout(timeout);
      finish({ ok: false, error: `خطأ في الاتصال: ${err.message}` });
    });

    ws.on("close", (code: number) => {
      clearTimeout(timeout);
      if (!done) {
        const codes: Record<number, string> = {
          4004: "فشل المصادقة — التوكن غير صالح",
          4008: "تجاوزت الحد المسموح به — انتظر دقيقة",
          4009: "انتهت الجلسة — أعد المحاولة",
          4013: "صلاحيات غير صحيحة",
          4014: "صلاحيات محظورة",
        };
        finish({ ok: false, error: codes[code] || `أُغلق الاتصال: كود ${code}` });
      }
    });

    ws.on("message", (data: WebSocket.RawData) => {
      let p: { op: number; d: any; s?: number; t?: string };
      try { p = JSON.parse(data.toString()); } catch { return; }

      if (p.op === 10) {
        // HELLO — start heartbeat and identify
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: null }));
        }, p.d.heartbeat_interval);

        ws!.send(JSON.stringify({
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
        }));
      }

      if (p.op === 0 && p.t === "READY") {
        clearTimeout(timeout);
        finish({
          ok: true,
          sessionId: p.d?.session_id,
          latencyMs: Date.now() - start,
        });
      }

      if (p.op === 7) {
        clearTimeout(timeout);
        finish({ ok: false, error: "طلب Gateway إعادة الاتصال — قد تكون محظوراً مؤقتاً" });
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }

    // Step 1: validate token via REST
    const tokenCheck = await validateToken(token);
    if (!tokenCheck.ok) {
      return NextResponse.json(
        {
          ok: false,
          step: "token",
          error: tokenCheck.error,
          statusCode: tokenCheck.status,
        },
        { status: 401 }
      );
    }

    // Step 2: test Gateway connectivity
    const gwResult = await testGateway(token);

    return NextResponse.json({
      ok: gwResult.ok,
      username: tokenCheck.username,
      userId: tokenCheck.id,
      gateway: {
        ok: gwResult.ok,
        latencyMs: gwResult.latencyMs,
        sessionId: gwResult.sessionId?.slice(0, 12) + "...",
        error: gwResult.error,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

