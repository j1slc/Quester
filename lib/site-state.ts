import { redis, redisPipeline, isRedisConfigured } from "./redis";

const KEY_USERS = "quester:users";
const KEY_MAINTENANCE = "quester:maintenance";
const KEY_ANNOUNCEMENT = "quester:announcement";

export const MAX_TEXT_LENGTH = 500;
export const DEFAULT_MAINTENANCE_MESSAGE = "الموقع تحت الصيانة حالياً، سنعود قريباً.";

export interface MaintenanceState {
  enabled: boolean;
  message: string;
}

export interface AnnouncementState {
  enabled: boolean;
  text: string;
  updatedAt: number;
}

export interface SiteState {
  maintenance: MaintenanceState;
  announcement: AnnouncementState;
}

// Only non-sensitive identifiers are stored. Never the token, never the email.
export interface StoredUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  firstSeen: number;
  lastSeen: number;
  logins: number;
}

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function defaultState(): SiteState {
  return {
    maintenance: { enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE },
    announcement: { enabled: false, text: "", updatedAt: 0 },
  };
}

// Public state. Fails open: if the database is missing or down, the site stays up.
export async function getSiteState(): Promise<SiteState> {
  const fallback = defaultState();
  if (!isRedisConfigured()) return fallback;

  try {
    const [rawMaintenance, rawAnnouncement] = await redisPipeline([
      ["GET", KEY_MAINTENANCE],
      ["GET", KEY_ANNOUNCEMENT],
    ]);
    const maintenance = parseJson<Partial<MaintenanceState>>(rawMaintenance, {});
    const announcement = parseJson<Partial<AnnouncementState>>(rawAnnouncement, {});

    return {
      maintenance: {
        enabled: Boolean(maintenance.enabled),
        message: maintenance.message || DEFAULT_MAINTENANCE_MESSAGE,
      },
      announcement: {
        enabled: Boolean(announcement.enabled) && Boolean(announcement.text),
        text: announcement.text || "",
        updatedAt: announcement.updatedAt || 0,
      },
    };
  } catch {
    return fallback;
  }
}

export async function setMaintenance(enabled: boolean, message: string): Promise<void> {
  const value: MaintenanceState = {
    enabled,
    message: message.trim().slice(0, MAX_TEXT_LENGTH) || DEFAULT_MAINTENANCE_MESSAGE,
  };
  await redis("SET", KEY_MAINTENANCE, JSON.stringify(value));
}

export async function setAnnouncement(enabled: boolean, text: string): Promise<void> {
  const value: AnnouncementState = {
    enabled,
    text: text.trim().slice(0, MAX_TEXT_LENGTH),
    updatedAt: Date.now(),
  };
  await redis("SET", KEY_ANNOUNCEMENT, JSON.stringify(value));
}

// Returns a 503 Response while maintenance mode is on, otherwise null.
export async function maintenanceBlock(): Promise<Response | null> {
  const { maintenance } = await getSiteState();
  if (!maintenance.enabled) return null;
  return new Response(
    JSON.stringify({ error: maintenance.message, maintenance: true }),
    { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
  );
}

// Records that a user logged in. Best effort: never throws, never blocks the request.
export async function recordUser(user: {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}): Promise<void> {
  if (!isRedisConfigured() || !user?.id) return;

  try {
    const now = Date.now();
    const previous = parseJson<StoredUser | null>(await redis("HGET", KEY_USERS, user.id), null);

    // Build the record from an explicit allow-list of fields. Do not spread `user`.
    const record: StoredUser = {
      id: user.id,
      username: user.username,
      globalName: user.global_name ?? null,
      avatar: user.avatar ?? null,
      firstSeen: previous?.firstSeen ?? now,
      lastSeen: now,
      logins: (previous?.logins ?? 0) + 1,
    };
    await redis("HSET", KEY_USERS, user.id, JSON.stringify(record));
  } catch {
    // ignore storage errors
  }
}

export async function listUsers(limit = 1000): Promise<StoredUser[]> {
  const flat = (await redis("HGETALL", KEY_USERS)) as string[] | null;
  if (!Array.isArray(flat)) return [];

  const users: StoredUser[] = [];
  for (let i = 1; i < flat.length; i += 2) {
    const user = parseJson<StoredUser | null>(flat[i], null);
    if (user?.id) users.push(user);
  }
  users.sort((a, b) => b.lastSeen - a.lastSeen);
  return users.slice(0, limit);
}

// Allows 5 attempts per IP per sliding 15 minutes. Returns false when blocked.
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 900;

function loginKey(ip: string): string {
  return `quester:admin-login:${ip.replace(/[^0-9a-fA-F:.]/g, "").slice(0, 64) || "unknown"}`;
}

export async function registerLoginAttempt(ip: string): Promise<boolean> {
  if (!isRedisConfigured()) return true;
  try {
    const key = loginKey(ip);
    const [count] = await redisPipeline([
      ["INCR", key],
      ["EXPIRE", key, LOGIN_WINDOW_SECONDS],
    ]);
    return Number(count) <= MAX_LOGIN_ATTEMPTS;
  } catch {
    return true;
  }
}

export async function clearLoginAttempts(ip: string): Promise<void> {
  if (!isRedisConfigured()) return;
  try {
    await redis("DEL", loginKey(ip));
  } catch {
    // ignore
  }
}
