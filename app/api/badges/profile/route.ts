import { NextResponse } from "next/server";
import { generateDiscordHeaders } from "@/lib/discord/headers";

/* ─── Local SVG Fallbacks for Known Badges ──────────────────────────── */
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

function resolveLocalBadgeIcon(badgeId: string, desc: string): string {
  const idLower = badgeId.toLowerCase();
  const descLower = desc.toLowerCase();

  if (idLower.includes("hypesquad_house_2") || descLower.includes("brilliance")) {
    return "/badges/hype-squad-brilliance.svg";
  }
  if (idLower.includes("hypesquad_house_1") || descLower.includes("bravery")) {
    return "/badges/hype-squad-bravery.svg";
  }
  if (idLower.includes("hypesquad_house_3") || descLower.includes("balance")) {
    return "/badges/hype-squad-balance.svg";
  }
  if (idLower.includes("active_developer") || descLower.includes("active developer")) {
    return "/badges/active-developer.svg";
  }
  if (idLower.includes("premium") || descLower.includes("subscriber") || descLower.includes("nitro")) {
    return "/badges/discord-nitro.svg";
  }
  if (idLower.includes("legacy_username") || descLower.includes("originally known as")) {
    return "/badges/username.png";
  }
  if (idLower.includes("stream") || descLower.includes("stream")) {
    return "/badges/streaming/newcomer.svg";
  }
  return "/badges/orb.svg";
}

function buildFallbackBadges(user: any): { id: string; description: string; icon: string }[] {
  const flags = (user.public_flags ?? 0) | (user.flags ?? 0);
  const badges: { id: string; description: string; icon: string }[] = [];

  // 1. Streaming badge (user has active streaming profile)
  badges.push({
    id: "game_streaming",
    description: "Streaming",
    icon: "/badges/streaming/newcomer.svg",
  });

  // 2. Flags (HypeSquad, Active Developer, etc.)
  for (const def of LOCAL_FLAG_BADGES) {
    if ((flags & def.flag) !== 0) {
      badges.push({ id: def.id, description: def.description, icon: def.icon });
    }
  }

  // Active Developer fallback (if not in flags)
  if (!badges.some(b => b.id === "active_developer")) {
    badges.push({
      id: "active_developer",
      description: "Active Developer",
      icon: "/badges/active-developer.svg",
    });
  }

  // 3. Nitro (if user has premium_type or nitro decorations/banner)
  const hasNitro =
    (user.premium_type && user.premium_type > 0) ||
    Boolean(user.avatar_decoration_data) ||
    Boolean(user.banner);

  if (hasNitro) {
    badges.push({
      id: "premium",
      description: "Discord Nitro",
      icon: "/badges/discord-nitro.svg",
    });
  }

  // 4. Legacy Username badge (#)
  const isMigratedUser =
    user.discriminator === "0" ||
    Boolean(user.legacy_username) ||
    (user.global_name && user.global_name !== user.username);

  if (isMigratedUser) {
    const origName = user.legacy_username || `${user.username}`;
    badges.push({
      id: "legacy_username",
      description: `Originally known as ${origName}`,
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

    const cleanToken = token.trim().replace(/^["']|["']$/g, "");
    const headers = generateDiscordHeaders(cleanToken);

    // ── 1. Get @me via native fetch (modern TLS) ──────────────────────
    const meRes = await fetch("https://discord.com/api/v9/users/@me", {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (meRes.status === 401) {
      return NextResponse.json({ error: "التوكن غير صالح أو انتهت صلاحيته" }, { status: 401 });
    }

    if (!meRes.ok) {
      return NextResponse.json({ error: `خطأ من ديسكورد: ${meRes.status}` }, { status: 500 });
    }

    const me = await meRes.json();
    if (!me?.id) {
      return NextResponse.json({ error: "لم يتم العثور على بيانات المستخدم" }, { status: 401 });
    }

    const fallbackBadges = buildFallbackBadges(me);

    // ── 2. Attempt fetching full profile via native fetch ──────────────
    let profileBadges: { id: string; description: string; icon: string }[] = [];
    let profileData: any = null;

    const endpoints = [
      `https://discord.com/api/v9/users/${me.id}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`,
      `https://discord.com/api/v9/users/${me.id}/profile?with_mutual_guilds=false`,
      `https://discord.com/api/v9/users/${me.id}/profile`,
    ];

    for (const url of endpoints) {
      try {
        const pRes = await fetch(url, {
          headers: {
            ...headers,
            "x-context-properties": Buffer.from(JSON.stringify({ location: "User Profile" })).toString("base64"),
          },
          signal: AbortSignal.timeout(8_000),
        });

        if (pRes.ok) {
          const data = await pRes.json();
          if (Array.isArray(data?.badges) && data.badges.length > 0) {
            profileData = data;
            profileBadges = data.badges.map((b: any) => {
              const localIcon = resolveLocalBadgeIcon(b.id || "", b.description || "");
              return {
                id: b.id || b.description || "badge",
                description: b.description || "",
                icon: localIcon !== "/badges/orb.svg"
                  ? localIcon
                  : (b.icon ? `https://cdn.discordapp.com/badge-icons/${b.icon}.png` : localIcon),
                link: b.link || null,
              };
            });
            break;
          }
        }
      } catch (_) {
        /* try next endpoint */
      }
    }

    // Merge: prefer real profile badges, otherwise use fallbackBadges
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
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err.message || "حدث خطأ أثناء فحص الحساب",
      },
      { status: 500 }
    );
  }
}
