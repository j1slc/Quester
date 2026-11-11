import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { isRedisConfigured } from "@/lib/redis";
import { getSiteState, listUsers } from "@/lib/site-state";

// Admin only: users (no tokens), maintenance state, announcement.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const dbConfigured = isRedisConfigured();
  try {
    const [state, users] = await Promise.all([
      getSiteState(),
      dbConfigured ? listUsers() : Promise.resolve([]),
    ]);
    return NextResponse.json(
      { dbConfigured, users, ...state },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "تعذر جلب البيانات" },
      { status: 500 }
    );
  }
}
