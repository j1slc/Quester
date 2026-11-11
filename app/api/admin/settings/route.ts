import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { isRedisConfigured } from "@/lib/redis";
import {
  MAX_TEXT_LENGTH,
  getSiteState,
  setAnnouncement,
  setMaintenance,
} from "@/lib/site-state";

// Admin only: save maintenance mode and/or the announcement message.
export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: "قاعدة البيانات غير مضبوطة (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();

    if (body?.maintenance) {
      const { enabled, message } = body.maintenance;
      if (typeof message === "string" && message.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: "رسالة الصيانة طويلة جداً." }, { status: 400 });
      }
      await setMaintenance(Boolean(enabled), typeof message === "string" ? message : "");
    }

    if (body?.announcement) {
      const { enabled, text } = body.announcement;
      if (typeof text === "string" && text.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: "نص الإعلان طويل جداً." }, { status: 400 });
      }
      await setAnnouncement(Boolean(enabled), typeof text === "string" ? text : "");
    }

    return NextResponse.json({ success: true, ...(await getSiteState()) });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل حفظ الإعدادات" },
      { status: 500 }
    );
  }
}
