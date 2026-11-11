import crypto from "crypto";

// Admin session = a cookie holding "<expiryMs>.<hmac>", signed with ADMIN_SESSION_SECRET.
// Env vars: ADMIN_PASSWORD, ADMIN_SESSION_SECRET (at least 32 characters).

export const ADMIN_COOKIE = "quester_admin";
const SESSION_SECONDS = 60 * 60 * 8;

export function isAdminConfigured(): boolean {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(password) && Boolean(secret) && (secret as string).length >= 32;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET || "")
    .update(payload)
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) return false;
  // Hash both sides so the comparison is constant-length.
  const hash = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(hash(input), hash(expected));
}

export function createSessionValue(): string {
  const expires = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expires}.${sign(expires)}`;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

export function isAdminRequest(req: Request): boolean {
  if (!isAdminConfigured()) return false;
  const value = readCookie(req, ADMIN_COOKIE);
  if (!value) return false;

  const [expires, signature] = value.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown").trim();
}
