import { NextResponse } from "next/server";
import { createDiscordClient } from "@/lib/discord/client";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }

    const client = createDiscordClient(token.trim());

    // 1. Get @me
    const { data: me } = await client.get("/users/@me");
    if (!me?.id) {
      return NextResponse.json({ error: "التوكن غير صالح أو انتهت صلاحيته" }, { status: 401 });
    }

    // 2. Fetch full profile with badges & profile details
    let profileBadges: any[] = [];
    let profileData: any = null;

    try {
      const profileRes = await client.get(
        `/users/${me.id}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`
      );
      profileData = profileRes.data;
      if (Array.isArray(profileData?.badges)) {
        profileBadges = profileData.badges;
      }
    } catch (err: any) {
      console.error("Failed to fetch full profile badges:", err?.response?.status, err?.message);
    }

    // Format badges
    const badges = profileBadges.map((b: any) => {
      const iconUrl = b.icon
        ? b.icon.startsWith("http")
          ? b.icon
          : `https://cdn.discordapp.com/badge-icons/${b.icon}.png`
        : "/badges/orb.svg";

      return {
        id: b.id || b.description || "badge",
        description: b.description || "",
        icon: iconUrl,
        link: b.link || null,
      };
    });

    // Merge full user data
    const userMerged = {
      ...me,
      ...(profileData?.user || {}),
      bio: profileData?.user_profile?.bio || me.bio || null,
      pronouns: profileData?.user_profile?.pronouns || null,
      banner: profileData?.user?.banner || me.banner || profileData?.user_profile?.banner || null,
      banner_color: profileData?.user_profile?.banner_color || me.banner_color || null,
      accent_color: profileData?.user?.accent_color ?? me.accent_color ?? profileData?.user_profile?.accent_color ?? null,
      avatar_decoration_data: profileData?.user?.avatar_decoration_data || me.avatar_decoration_data || null,
    };

    return NextResponse.json({
      success: true,
      user: userMerged,
      badges,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.response?.data?.message || err.message || "حدث خطأ أثناء فحص الحساب" },
      { status: 500 }
    );
  }
}
