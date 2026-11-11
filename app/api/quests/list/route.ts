import { NextResponse } from "next/server";
import { fetchUserQuests } from "@/lib/discord/client";
import { maintenanceBlock } from "@/lib/site-state";

export async function POST(req: Request) {
  const blocked = await maintenanceBlock();
  if (blocked) return blocked;

  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }

    const quests = await fetchUserQuests(token);
    return NextResponse.json({ success: true, quests });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء جلب المهام" },
      { status: 500 }
    );
  }
}
