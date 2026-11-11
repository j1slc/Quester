import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  clientIp,
  createSessionValue,
  isAdminConfigured,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/admin-auth";
import { clearLoginAttempts, registerLoginAttempt } from "@/lib/site-state";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "لوحة الأدمن غير مفعّلة. اضبط ADMIN_PASSWORD و ADMIN_SESSION_SECRET." },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  if (!(await registerLoginAttempt(ip))) {
    return NextResponse.json(
      { error: "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة." },
      { status: 429 }
    );
  }

  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // fall through with empty password
  }

  if (!password || !passwordMatches(password)) {
    return NextResponse.json({ error: "كلمة المرور غير صحيحة." }, { status: 401 });
  }

  await clearLoginAttempts(ip);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, createSessionValue(), sessionCookieOptions());
  return res;
}
