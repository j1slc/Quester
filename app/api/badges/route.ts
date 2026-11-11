import { NextResponse } from "next/server";
import {
  fetchDiscordUser,
  getHypeSquadHouse,
  setHypeSquadHouse,
  leaveHypeSquadHouse,
} from "@/lib/discord/client";
import { cleanToken } from "@/lib/discord/headers";
import { maintenanceBlock, recordUser } from "@/lib/site-state";

export async function POST(req: Request) {
  const blocked = await maintenanceBlock();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const token = cleanToken(body.token || "");
    const action = body.action || (body.houseId ? "set" : "check");
    const houseId = body.houseId ? Number(body.houseId) : undefined;

    if (!token) {
      return NextResponse.json(
        { error: "الرجاء إدخال رمز التوكن (Token) الخاص بحسابك في ديسكورد" },
        { status: 400 }
      );
    }

    // 1. Verify user identity
    const user = await fetchDiscordUser(token);
    if (!user) {
      return NextResponse.json(
        { error: "التوكن غير صالح أو انتهت صلاحيته. تأكد من نسخه بشكل صحيح من ديسكورد." },
        { status: 401 }
      );
    }

    // 2. Action: Check
    if (action === "check") {
      // Store only id/username/avatar (never the token or email) for the admin panel.
      await recordUser(user);
      const currentHouse = getHypeSquadHouse(user);
      return NextResponse.json({
        success: true,
        user,
        currentHouse,
      });
    }

    // 3. Action: Leave HypeSquad
    if (action === "leave") {
      const res = await leaveHypeSquadHouse(token);
      if (!res.success) {
        return NextResponse.json(
          { error: res.error || "فشل إزالة الشارة من الحساب" },
          { status: 400 }
        );
      }

      const updatedUser = (await fetchDiscordUser(token)) || user;
      return NextResponse.json({
        success: true,
        message: "تمت إزالة شارة HypeSquad بنجاح من حسابك!",
        user: updatedUser,
        currentHouse: getHypeSquadHouse(updatedUser),
      });
    }

    // 4. Action: Set HypeSquad House
    if (!houseId || ![1, 2, 3].includes(houseId)) {
      return NextResponse.json(
        { error: "الرجاء تحديد الشارة المطلوبة (1: بيت الشجاعة، 2: بيت التألق، 3: بيت التوازن)" },
        { status: 400 }
      );
    }

    const res = await setHypeSquadHouse(token, houseId);
    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "فشل تعيين الشارة في حسابك" },
        { status: 400 }
      );
    }

    // Fetch updated user to get new flags
    const updatedUser = (await fetchDiscordUser(token)) || user;
    const houseNames: Record<number, string> = {
      1: "بيت الشجاعة (Bravery)",
      2: "بيت التألق (Brilliance)",
      3: "بيت التوازن (Balance)",
    };

    return NextResponse.json({
      success: true,
      message: `تم تعيين شارة ${houseNames[houseId]} بنجاح على حسابك في ديسكورد! تفقد ملفك الشخصي الآن 🎉`,
      user: updatedUser,
      currentHouse: getHypeSquadHouse(updatedUser) || houseId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "حدث خطأ غير متوقع أثناء الاتصال بسيرفرات ديسكورد" },
      { status: 500 }
    );
  }
}

