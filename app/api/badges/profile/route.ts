import { NextResponse } from "next/server";
import { createDiscordClient } from "@/lib/discord/client";

/* ─── Local SVG Fallbacks for Flags ─────────────────────────────────── */
const LOCAL_FLAG_BADGES: { flag: number; id: string; description: string; icon: string }[] = [
  { flag: 1 << 0, id: "staff", description: "Discord Staff", icon: "/badges/active-developer.svg" },
  { flag: 1 << 1, id: "partner", description: "Partnered Server Owner", icon: "/badges/active-developer.svg" },
  { flag: 1 << 2, id: "hypesquad", description: "HypeSquad Events", icon: "/badges/hype-squad-bravery.svg" },
  { flag: 1 << 3, id: "bug_hunter_level_1", description: "Bug Hunter Level 1", icon: "/badges/active-developer.svg" },
  { flag: 1 << 6, id: "hypesquad_bravery", description: "HypeSquad Bravery", icon: "/badges/hype-squad-bravery.svg" },
  { flag: 1 << 7, id: "hypesquad_brilliance", description: "HypeSquad Brilliance", icon: "/badges/hype-squad-brilliance.svg" },
  { flag: 1 << 8, id: "hypesquad_balance", description: "HypeSquad Balance", icon: "/badges/hype-squad-balance.svg" },
  { flag: 1 << 9, id: "early_supporter", description: "Early Supporter", icon: "/badges/discord-nitro.svg" },
  { flag: 1 << 14, id: "bug_hunter_level_2", description: "Bug Hunter Level 2", icon: "/badges/active-developer.svg" },
  { flag: 1 << 17, id: "verified_developer", description: "Verified Bot Developer", icon: "/badges/active-developer.svg" },
  { flag: 1 << 18, id: "certified_moderator", description: "Discord Certified Moderator", icon: "/badges/active-developer.svg" },
  { flag: 1 << 22, id: "active_developer", description: "Active Developer", icon: "/badges/active-developer.svg" },
];

function buildFallbackBadges(user: any): { id: string; description: string; icon: string }[] {
  const flags = (user.public_flags ?? 0) | (user.flags ?? 0);
  const badges: { id: string; description: string; icon: string }[] = [];

  // Nitro
  if (user.premium_type === 1 || user.premium_type === 2) {
    badges.push({ id: "nitro", description: "Discord Nitro", icon: "/badges/discord-nitro.svg" });
  } else if (user.premium_type === 3) {
    badges.push({ id: "nitro_basic", description: "Nitro Basic", icon: "/badges/discord-nitro-basic.svg" });
  }

  // Flags
  for (const def of LOCAL_FLAG_BADGES) {
    if ((flags & def.flag) !== 0) {
      badges.push({ id: def.id, description: def.description, icon: def.icon });
    }
  }

  // Legacy username badge
  if (user.legacy_username) {
    badges.push({
      id: "legacy_username",
      description: `Originally known as ${user.legacy_username}`,
      icon: "/badges/username.png",
    });
  }

  return badges;
}

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "التوكن مطلوب" }, { status: 400 });
    }

    const client = createDiscordClient(token.trim());

    // ── 1. Get @me ─────────────────────────────────────────────────────
    const { data: me } = await client.get("/users/@me");
    if (!me?.id) {
      return NextResponse.json({ error: "التوكن غير صالح أو انتهت صلاحيته" }, { status: 401 });
    }

    const fallbackBadges = buildFallbackBadges(me);

    // ── 2. Attempt fetching full profile ───────────────────────────────
    let profileBadges: { id: string; description: string; icon: string }[] = [];
    let profileData: any = null;
    let fetchDebug: any = null;

    // Try multiple profile endpoint variants in case one is blocked
    const endpoints = [
      `/users/${me.id}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`,
      `/users/${me.id}/profile?with_mutual_guilds=false`,
      `/users/${me.id}/profile`,
    ];

    for (const ep of endpoints) {
      try {
        const res = await client.get(ep, {
          headers: {
            "x-context-properties": Buffer.from(JSON.stringify({ location: "User Profile" })).toString("base64"),
          },
        });
        if (res.data) {
          profileData = res.data;
          if (Array.isArray(profileData?.badges) && profileData.badges.length > 0) {
            profileBadges = profileData.badges.map((b: any) => ({
              id: b.id || b.description || "badge",
              description: b.description || "",
              icon: b.icon
                ? b.icon.startsWith("http")
                  ? b.icon
                  : `https://cdn.discordapp.com/badge-icons/${b.icon}.png`
                : "/badges/orb.svg",
              link: b.link || null,
            }));
            fetchDebug = { endpoint: ep, success: true, count: profileBadges.length };
            break;
          }
        }
      } catch (err: any) {
        fetchDebug = {
          endpoint: ep,
          status: err?.response?.status,
          message: err?.response?.data?.message || err.message,
        };
      }
    }

    // If profile endpoint succeeded, use real badges; otherwise use safe local fallback badges
    const badges = profileBadges.length > 0 ? profileBadges : fallbackBadges;

    // ── 3. Merge user data ─────────────────────────────────────────────
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
      debug: fetchDebug,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.response?.data?.message || err.message || "حدث خطأ أثناء فحص الحساب",
      },
      { status: 500 }
    );
  }
}
