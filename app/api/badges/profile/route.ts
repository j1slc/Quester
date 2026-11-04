import { NextResponse } from "next/server";
import { createDiscordClient } from "@/lib/discord/client";

/* ─── Discord flag → badge mapping ─────────────────────────────────── */
const FLAG_BADGE_MAP: { flag: number; id: string; description: string; icon: string }[] = [
  { flag: 1 << 0, id: "staff", description: "Discord Staff", icon: "5e74e9b61934fc1f67c2387e0309e607" },
  { flag: 1 << 1, id: "partner", description: "Partnered Server Owner", icon: "3f9748e53446a996cb78ad84b051221e" },
  { flag: 1 << 2, id: "hypesquad", description: "HypeSquad Events", icon: "bf01d1073931f921909045f3a39fd264" },
  { flag: 1 << 3, id: "bug_hunter_level_1", description: "Bug Hunter Level 1", icon: "2717692c7dca7289b35297368a940dd0" },
  { flag: 1 << 6, id: "hypesquad_bravery", description: "HypeSquad Bravery", icon: "8a88d63823d8a71cd5e390baa45efa02" },
  { flag: 1 << 7, id: "hypesquad_brilliance", description: "HypeSquad Brilliance", icon: "011940fd013082d85d96680afe7fb8d3" },
  { flag: 1 << 8, id: "hypesquad_balance", description: "HypeSquad Balance", icon: "b2b93b1f27b40c4f3b92f72e9f68895a" },
  { flag: 1 << 9, id: "early_supporter", description: "Early Supporter", icon: "7060786766c9c840eb3019e725d2b358" },
  { flag: 1 << 14, id: "bug_hunter_level_2", description: "Bug Hunter Level 2", icon: "848f79194d4be5ff5f81505cbd0ce1e6" },
  { flag: 1 << 17, id: "verified_developer", description: "Verified Bot Developer", icon: "6df5892e0f35b051f8b61eace34f4967" },
  { flag: 1 << 18, id: "certified_moderator", description: "Discord Certified Moderator", icon: "fee1624003f171f85d0de3d84f0fb176" },
  { flag: 1 << 22, id: "active_developer", description: "Active Developer", icon: "6f9e37f9029ff57aef81db857890005e" },
];

const NITRO_BADGE_MAP: { type: number; id: string; description: string; icon: string }[] = [
  { type: 1, id: "nitro_classic", description: "Subscriber since {{date}}", icon: "2ba85e8026a8614b640c2837bcdfe21b" },
  { type: 2, id: "nitro", description: "Subscriber since {{date}}", icon: "2ba85e8026a8614b640c2837bcdfe21b" },
  { type: 3, id: "nitro_basic", description: "Subscriber since {{date}}", icon: "2ba85e8026a8614b640c2837bcdfe21b" },
];

function cdnBadge(icon: string): string {
  return `https://cdn.discordapp.com/badge-icons/${icon}.png`;
}

function buildBadgesFromFlags(user: any): { id: string; description: string; icon: string }[] {
  const flags = (user.public_flags ?? 0) | (user.flags ?? 0);
  const badges: { id: string; description: string; icon: string }[] = [];

  for (const def of FLAG_BADGE_MAP) {
    if (flags & def.flag) {
      badges.push({ id: def.id, description: def.description, icon: cdnBadge(def.icon) });
    }
  }

  const nitroDef = NITRO_BADGE_MAP.find((n) => n.type === (user.premium_type ?? 0));
  if (nitroDef) {
    badges.push({ id: nitroDef.id, description: "Discord Nitro", icon: cdnBadge(nitroDef.icon) });
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

    // ── Step 1: Basic user info (always works) ─────────────────────────
    const { data: me } = await client.get("/users/@me");
    if (!me?.id) {
      return NextResponse.json({ error: "التوكن غير صالح أو انتهت صلاحيته" }, { status: 401 });
    }

    // Build flag-based badges as reliable fallback
    const flagBadges = buildBadgesFromFlags(me);

    // ── Step 2: Try full profile for real badge list (may fail on Vercel) ──
    let profileBadges: { id: string; description: string; icon: string }[] = [];
    let profileData: any = null;

    try {
      const profileRes = await client.get(
        `/users/${me.id}/profile?with_mutual_guilds=false&with_mutual_friends_count=false`
      );
      profileData = profileRes.data;

      if (Array.isArray(profileData?.badges) && profileData.badges.length > 0) {
        profileBadges = profileData.badges.map((b: any) => ({
          id: b.id || b.description || "badge",
          description: b.description || "",
          icon: b.icon
            ? b.icon.startsWith("http")
              ? b.icon
              : cdnBadge(b.icon)
            : "/badges/orb.svg",
          link: b.link || null,
        }));
      }
    } catch (err: any) {
      // Expected to fail on Vercel/some hosting — fall back to flags
      console.warn("[badges/profile] profile endpoint failed:", err?.response?.status ?? err?.message);
    }

    // Use real profile badges if available, otherwise flag-derived badges
    const badges = profileBadges.length > 0 ? profileBadges : flagBadges;

    // ── Step 3: Merge user data ────────────────────────────────────────
    const userMerged = {
      ...me,
      ...(profileData?.user || {}),
      bio: profileData?.user_profile?.bio || me.bio || null,
      pronouns: profileData?.user_profile?.pronouns || null,
      banner:
        profileData?.user?.banner ||
        me.banner ||
        profileData?.user_profile?.banner ||
        null,
      banner_color:
        profileData?.user_profile?.banner_color || me.banner_color || null,
      accent_color:
        profileData?.user?.accent_color ??
        me.accent_color ??
        profileData?.user_profile?.accent_color ??
        null,
      avatar_decoration_data:
        profileData?.user?.avatar_decoration_data ||
        me.avatar_decoration_data ||
        null,
    };

    return NextResponse.json({
      success: true,
      user: userMerged,
      badges,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          err.response?.data?.message ||
          err.message ||
          "حدث خطأ أثناء فحص الحساب",
      },
      { status: 500 }
    );
  }
}
