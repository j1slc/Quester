import { NextResponse } from "next/server";
import { runGatewaySpoof } from "@/lib/discord/gateway";

/**
 * Badge Spoofer API (v2) – Uses Discord WebSocket Gateway (OP 3 Status Update)
 * to cycle rich presence through many games, which is what Discord actually uses
 * to credit Game Time and Game Variety badges.
 *
 * The old /api/v9/science approach was analytics-only and did NOT credit badges.
 * Discord credits these badges based on rich presence data received over Gateway.
 */

const GAMES_CDN_URL = "https://cdn.discordapp.com/detectables/games.json";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) discord/1.0.9253 Chrome/148.0.7778.280 " +
  "Electron/42.7.1 Safari/537.36";

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

async function validateToken(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://discord.com/api/v9/users/@me", {
      headers: {
        authorization: token,
        "user-agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 401) return { ok: false, error: "التوكن غير صالح أو منتهي الصلاحية" };
    if (!res.ok) return { ok: false, error: `خطأ من ديسكورد: ${res.status}` };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: `تعذر الاتصال بديسكورد: ${err.message}` };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, mode, gameCount } = body as {
      token?: string;
      mode?: "playtime" | "variety";
      gameCount?: number;
    };

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }

    const cleanToken = token.trim();

    // Validate token first
    const validation = await validateToken(cleanToken);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    // Load game list
    let allGames: Game[];
    try {
      allGames = await loadGames();
    } catch (err: any) {
      return NextResponse.json(
        { error: `فشل تحميل قائمة الألعاب: ${err.message}` },
        { status: 500 }
      );
    }

    if (allGames.length === 0) {
      return NextResponse.json(
        { error: "قائمة الألعاب فارغة — حاول مرة أخرى" },
        { status: 500 }
      );
    }

    const spoofMode = mode ?? "playtime";

    // For variety mode: cycle through as many unique games as possible
    // For playtime mode: use a smaller set but hold each one longer
    let selectedGames: Game[];
    let holdMs: number;

    if (spoofMode === "variety") {
      // Variety badge: needs many unique games detected
      // Hold each game for 35 seconds (minimum for Discord to register it)
      const count = Math.min(gameCount ?? 500, allGames.length);
      selectedGames = allGames.slice(0, count);
      holdMs = 35_000; // 35 seconds per game
    } else {
      // Playtime badge: needs total hours on a single game or across games
      // Hold each game longer to accumulate hours
      const count = Math.min(gameCount ?? 100, allGames.length);
      selectedGames = allGames.slice(0, count);
      holdMs = 60_000; // 60 seconds per game
    }

    // Run the Gateway spoof
    // NOTE: This is a streaming/long operation. We use a reasonable timeout
    // but limit games per request to avoid server timeouts.
    // The frontend should call this in batches for large game counts.
    const MAX_GAMES_PER_REQUEST = 20; // Keep each request under ~15 minutes
    const batch = selectedGames.slice(0, MAX_GAMES_PER_REQUEST);

    const controller = new AbortController();
    // 15-minute server-side timeout
    const serverTimeout = setTimeout(() => controller.abort(), 15 * 60 * 1000);

    let result: { done: number; total: number };
    try {
      result = await runGatewaySpoof({
        token: cleanToken,
        games: batch,
        holdMs,
        signal: controller.signal,
        onProgress: (_done, _total, _gameName) => {
          // Could log progress here if needed
        },
      });
    } finally {
      clearTimeout(serverTimeout);
    }

    return NextResponse.json({
      success: true,
      sentGames: result.done,
      totalGames: selectedGames.length,
      batchSize: MAX_GAMES_PER_REQUEST,
      mode: spoofMode,
      message:
        result.done > 0
          ? `تم إرسال حضور ${result.done} لعبة عبر Gateway. تحتاج لتكرار العملية لتغطية كل الألعاب.`
          : "لم يتم إرسال أي لعبة — تحقق من التوكن.",
    });
  } catch (err: any) {
    const msg: string = err?.message || "حدث خطأ غير متوقع";
    // Friendly messages for known errors
    if (msg.includes("4004") || msg.includes("Authentication")) {
      return NextResponse.json(
        { error: "التوكن غير صالح — تأكد من صحة التوكن وأنه من تطبيق ديسكورد الرسمي" },
        { status: 401 }
      );
    }
    if (msg.includes("4008") || msg.includes("rate limit")) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح به — انتظر دقيقة وأعد المحاولة" },
        { status: 429 }
      );
    }
    if (msg.includes("Aborted")) {
      return NextResponse.json(
        { error: "انتهت مهلة الاتصال — جرب عدد ألعاب أقل" },
        { status: 408 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
