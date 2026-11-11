import { NextResponse } from "next/server";
import { fetchDiscordUser } from "@/lib/discord/client";
import { maintenanceBlock, recordUser } from "@/lib/site-state";

export async function POST(req: Request) {
  const blocked = await maintenanceBlock();
  if (blocked) return blocked;

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "الرجاء إدخال التوكن" }, { status: 400 });
    }

    const user = await fetchDiscordUser(token);
    if (!user) {
      return NextResponse.json(
        { error: "التوكن غير صالح أو انتهت صلاحيته. تأكد من نسخه بشكل صحيح." },
        { status: 401 }
      );
    }

    // Store only id/username/avatar (never the token or email) for the admin panel.
    await recordUser(user);

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء فحص التوكن" },
      { status: 500 }
    );
  }
}
