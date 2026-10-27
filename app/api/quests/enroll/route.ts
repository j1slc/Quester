import { NextResponse } from "next/server";
import { enrollUserInQuest } from "@/lib/discord/client";

export async function POST(req: Request) {
  try {
    const { token, questId } = await req.json();
    if (!token || !questId) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });
    }

    const enrolled = await enrollUserInQuest(token, questId);
    if (!enrolled) {
      return NextResponse.json(
        { error: "تعذر التسجيل في المهمة (قد تكون مسجلاً بالفعل أو منتهية)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, enrolled: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل التسجيل في المهمة" },
      { status: 500 }
    );
  }
}
