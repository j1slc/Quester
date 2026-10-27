import { NextResponse } from "next/server";
import { fetchUserQuests } from "@/lib/discord/client";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }

    const quests = await fetchUserQuests(token);
    console.log(`[DEBUG /api/quests/list] Found ${quests.length} quests:`, quests.map(q => ({ id: q.id, title: q.title, expiresAt: q.expiresAt, isCompleted: q.isCompleted })));
    return NextResponse.json({ success: true, quests });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ أثناء جلب المهام" },
      { status: 500 }
    );
  }
}
