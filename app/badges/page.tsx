"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─── Discord user (same shape as /api/auth/token returns) ─── */
interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
  banner?: string | null;
  banner_color?: string | null;
  accent_color?: number | null;
  flags?: number;
  public_flags?: number;
  premium_type?: number;
  avatar_decoration_data?: {
    asset: string;
    sku_id?: string;
  } | null;
  bio?: string | null;
  pronouns?: string | null;
}

/* ─── Real badge from Discord profile API ─── */
interface DiscordBadge {
  id: string;
  description: string;
  icon: string;
  link?: string;
}

/* ─── Badge definition for the upgradable cards ─── */
interface BadgeTier {
  name: string;
  nameAr: string;
  icon: string; // path in /badges/
  requirement: string;
}

interface BadgeCategory {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  spoofMode: "playtime" | "variety" | "streaming";
  tiers: BadgeTier[];
  isComingSoon?: boolean;
}

/* ─── Discord flag → badge mapping for the profile card ─── */
const FLAG_BADGES: { flag: number; label: string; labelAr: string; icon: string }[] = [
  { flag: 1 << 0, label: "Discord Staff", labelAr: "موظف ديسكورد", icon: "/badges/active-developer.svg" },
  { flag: 1 << 1, label: "Partnered Server Owner", labelAr: "شريك ديسكورد", icon: "/badges/active-developer.svg" },
  { flag: 1 << 2, label: "HypeSquad Events", labelAr: "أحداث HypeSquad", icon: "/badges/hype-squad-bravery.svg" },
  { flag: 1 << 3, label: "Bug Hunter Level 1", labelAr: "صائد الأخطاء 1", icon: "/badges/active-developer.svg" },
  { flag: 1 << 6, label: "HypeSquad Bravery", labelAr: "HypeSquad Bravery", icon: "/badges/hype-squad-bravery.svg" },
  { flag: 1 << 7, label: "HypeSquad Brilliance", labelAr: "HypeSquad Brilliance", icon: "/badges/hype-squad-brilliance.svg" },
  { flag: 1 << 8, label: "HypeSquad Balance", labelAr: "HypeSquad Balance", icon: "/badges/hype-squad-balance.svg" },
  { flag: 1 << 9, label: "Early Supporter", labelAr: "داعم مبكر", icon: "/badges/discord-nitro.svg" },
  { flag: 1 << 14, label: "Bug Hunter Level 2", labelAr: "صائد الأخطاء 2", icon: "/badges/active-developer.svg" },
  { flag: 1 << 17, label: "Verified Bot Developer", labelAr: "مطور بوت موثق", icon: "/badges/active-developer.svg" },
  { flag: 1 << 18, label: "Certified Moderator", labelAr: "مشرف معتمد", icon: "/badges/active-developer.svg" },
  { flag: 1 << 22, label: "Active Developer", labelAr: "مطور نشط", icon: "/badges/active-developer.svg" },
];

/* Premium type badges (Nitro) */
const PREMIUM_BADGES: { type: number; label: string; labelAr: string; icon: string }[] = [
  { type: 1, label: "Nitro Classic", labelAr: "نيترو كلاسيك", icon: "/badges/discord-nitro.svg" },
  { type: 2, label: "Nitro", labelAr: "نيترو", icon: "/badges/discord-nitro.svg" },
  { type: 3, label: "Nitro Basic", labelAr: "نيترو بيسك", icon: "/badges/discord-nitro-basic.svg" },
];

/* ─── Game Time badge tiers ─── */
const GAME_TIME_TIERS: BadgeTier[] = [
  { name: "Casual", nameAr: "عادي", icon: "/badges/game-time/casual.svg", requirement: "50 ساعة لعب" },
  { name: "Recreational", nameAr: "ترفيهي", icon: "/badges/game-time/recreational.svg", requirement: "100 ساعة لعب" },
  { name: "Seasoned", nameAr: "متمرس", icon: "/badges/game-time/seasoned.svg", requirement: "250 ساعة لعب" },
  { name: "Committed", nameAr: "ملتزم", icon: "/badges/game-time/committed.svg", requirement: "500 ساعة لعب" },
  { name: "Dedicated", nameAr: "متفاني", icon: "/badges/game-time/dedicated.svg", requirement: "1000 ساعة لعب" },
  { name: "Serious", nameAr: "جدي", icon: "/badges/game-time/serious.svg", requirement: "2500 ساعة لعب" },
  { name: "Devoted", nameAr: "مخلص", icon: "/badges/game-time/devoted.svg", requirement: "5000 ساعة لعب" },
  { name: "Ironclad", nameAr: "حديدي", icon: "/badges/game-time/ironclad.svg", requirement: "10000 ساعة لعب" },
  { name: "Unshakeable", nameAr: "لا يتزعزع", icon: "/badges/game-time/unshakeable.svg", requirement: "25000 ساعة لعب" },
  { name: "Eternal", nameAr: "أبدي", icon: "/badges/game-time/eternal.svg", requirement: "50000 ساعة لعب" },
];

/* ─── Game Variety badge tiers ─── */
const GAME_VARIETY_TIERS: BadgeTier[] = [
  { name: "Sampler", nameAr: "مُجرّب", icon: "/badges/game-variety/sampler.svg", requirement: "3 ألعاب" },
  { name: "Dabbler", nameAr: "مُستكشف", icon: "/badges/game-variety/dabbler.svg", requirement: "5 ألعاب" },
  { name: "Explorer", nameAr: "رحّال", icon: "/badges/game-variety/explorer.svg", requirement: "10 ألعاب" },
  { name: "Adventurer", nameAr: "مغامر", icon: "/badges/game-variety/adventurer.svg", requirement: "25 ألعاب" },
  { name: "Enthusiast", nameAr: "شغوف", icon: "/badges/game-variety/enthusiast.svg", requirement: "50 ألعاب" },
  { name: "Ranger", nameAr: "حارس", icon: "/badges/game-variety/ranger.svg", requirement: "75 ألعاب" },
  { name: "Voyager", nameAr: "رحّالة", icon: "/badges/game-variety/voyager.svg", requirement: "100 ألعاب" },
  { name: "Maverick", nameAr: "رائد", icon: "/badges/game-variety/maverick.svg", requirement: "200 ألعاب" },
  { name: "Polymath", nameAr: "متعدد المعارف", icon: "/badges/game-variety/polymath.svg", requirement: "350 ألعاب" },
  { name: "Universalist", nameAr: "شامل", icon: "/badges/game-variety/universalist.svg", requirement: "500 ألعاب" },
];

/* ─── Streaming badge tiers ─── */
const STREAMING_TIERS: BadgeTier[] = [
  { name: "Newcomer", nameAr: "وافد جديد", icon: "/badges/streaming/newcomer.svg", requirement: "بداية البث" },
  { name: "Fledgling", nameAr: "ناشئ", icon: "/badges/streaming/fledgling.svg", requirement: "10 ساعات بث" },
  { name: "Standout", nameAr: "بارز", icon: "/badges/streaming/standout.svg", requirement: "25 ساعة بث" },
  { name: "Star", nameAr: "نجم", icon: "/badges/streaming/star.svg", requirement: "50 ساعة بث" },
  { name: "Breakout", nameAr: "متألق", icon: "/badges/streaming/breakout.svg", requirement: "100 ساعة بث" },
  { name: "Trendsetter", nameAr: "رائد الموضة", icon: "/badges/streaming/trendsetter.svg", requirement: "250 ساعة بث" },
  { name: "Headliner", nameAr: "متصدر", icon: "/badges/streaming/headliner.svg", requirement: "500 ساعة بث" },
  { name: "Sensation", nameAr: "إحساس", icon: "/badges/streaming/sensation.svg", requirement: "1000 ساعة بث" },
  { name: "Phenomenon", nameAr: "ظاهرة", icon: "/badges/streaming/phenomenon.svg", requirement: "2500 ساعة بث" },
  { name: "Visionary", nameAr: "صاحب رؤية", icon: "/badges/streaming/visionary.svg", requirement: "5000 ساعة بث" },
];

/* ─── Account Age badge tiers ─── */
const ACCOUNT_AGE_TIERS: BadgeTier[] = [
  { name: "Seed", nameAr: "بذرة", icon: "/badges/account-age/seed.svg", requirement: "سنة واحدة" },
  { name: "Sprout", nameAr: "برعم", icon: "/badges/account-age/sprout.svg", requirement: "سنتين" },
  { name: "Bud", nameAr: "زهرة", icon: "/badges/account-age/bud.svg", requirement: "3 سنوات" },
  { name: "Sapling", nameAr: "شتلة", icon: "/badges/account-age/sapling.svg", requirement: "4 سنوات" },
  { name: "Blossom", nameAr: "إزهار", icon: "/badges/account-age/blossom.svg", requirement: "5 سنوات" },
  { name: "Redwood", nameAr: "خشب أحمر", icon: "/badges/account-age/redwood.svg", requirement: "6 سنوات" },
  { name: "Sequoia", nameAr: "سيكويا", icon: "/badges/account-age/sequoia.svg", requirement: "7 سنوات" },
  { name: "Bristlecone", nameAr: "صنوبر عتيق", icon: "/badges/account-age/bristlecone.svg", requirement: "8 سنوات" },
  { name: "Stromatolite", nameAr: "ستروماتوليت", icon: "/badges/account-age/stromatolite.svg", requirement: "9 سنوات" },
  { name: "Primordial", nameAr: "بدائي", icon: "/badges/account-age/primordial.svg", requirement: "10 سنوات" },
];

const BADGE_CATEGORIES: BadgeCategory[] = [
  {
    id: "game-time",
    title: "Game Time",
    titleAr: "ساعات اللعب",
    description: "تطوير شارة ساعات اللعب على بروفايلك",
    spoofMode: "playtime",
    tiers: GAME_TIME_TIERS,
  },
  {
    id: "game-variety",
    title: "Game Variety",
    titleAr: "تنوع الألعاب",
    description: "تطوير شارة عدد الألعاب المختلفة على بروفايلك",
    spoofMode: "variety",
    tiers: GAME_VARIETY_TIERS,
  },
  {
    id: "streaming",
    title: "Streaming",
    titleAr: "البث المباشر",
    description: "شارات ساعات البث المباشر على ديسكورد (قريباً)",
    spoofMode: "streaming",
    isComingSoon: true,
    tiers: STREAMING_TIERS,
  },
  {
    id: "account-age",
    title: "Account Age",
    titleAr: "عمر الحساب",
    description: "شارات عمر الحساب — للعرض فقط (لا يمكن تطويرها)",
    spoofMode: "playtime",
    tiers: ACCOUNT_AGE_TIERS,
  },
];

/* ─── Cooldown key in localStorage ─── */
const COOLDOWN_KEY = "badge_spoof_cooldown";
const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours

export default function BadgesPage() {
  const [token, setToken] = useState("");
  const [cookie, setCookie] = useState("");
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Badge upgrade state
  const [selectedCategory, setSelectedCategory] = useState<string>("game-time");
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string } | null>(null);

  // Real Discord profile badges
  const [discordBadges, setDiscordBadges] = useState<DiscordBadge[]>([]);

  // Cooldown
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState("");

  // Load saved state
  useEffect(() => {
    const savedToken = localStorage.getItem("quester_token");
    if (savedToken) {
      setToken(savedToken);
      handleLogin(savedToken);
    }
    const savedCookie = localStorage.getItem("cf_clearance_cookie");
    if (savedCookie) {
      setCookie(savedCookie);
    }
    const savedCooldown = localStorage.getItem(COOLDOWN_KEY);
    if (savedCooldown) {
      const end = parseInt(savedCooldown, 10);
      if (end > Date.now()) {
        setCooldownEnd(end);
      } else {
        localStorage.removeItem(COOLDOWN_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (!cooldownEnd) {
      setCooldownRemaining("");
      return;
    }
    const tick = () => {
      const diff = cooldownEnd - Date.now();
      if (diff <= 0) {
        setCooldownEnd(null);
        setCooldownRemaining("");
        localStorage.removeItem(COOLDOWN_KEY);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCooldownRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleLogin = async (overrideToken?: string) => {
    const t = (overrideToken || token).trim();
    if (!t) {
      setErrorMsg("يرجى إدخال التوكن أولاً");
      return;
    }
    setErrorMsg(null);
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/badges/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "فشل التحقق");
      setUser(data.user);
      if (Array.isArray(data.badges)) {
        setDiscordBadges(data.badges);
      }
      localStorage.setItem("quester_token", t);
    } catch (err: any) {
      setErrorMsg(err.message);
      setUser(null);
      setDiscordBadges([]);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("quester_token");
    setUser(null);
    setDiscordBadges([]);
    setToken("");
    setCookie("");
    setErrorMsg(null);
    setUpgradeResult(null);
  };

  const handleUpgrade = async () => {
    setShowConfirm(false);
    setUpgrading(true);
    setUpgradeResult(null);
    setErrorMsg(null);

    const cat = BADGE_CATEGORIES.find((c) => c.id === selectedCategory)!;
    const lastTier = cat.tiers[cat.tiers.length - 1];

    let gameCount = 100;
    let hoursPerGame = 500;

    if (cat.spoofMode === "variety") {
      gameCount = 500; // المستوى الأخير: 500 لعبة (Universalist)
      hoursPerGame = 1;
    } else if (cat.id === "streaming") {
      gameCount = 50;
      hoursPerGame = 5000; // المستوى الأخير: 5000 ساعة (Visionary)
    } else {
      // Game Time
      gameCount = 100;
      hoursPerGame = 50000; // المستوى الأخير: 50,000 ساعة (Eternal)
    }

    if (cookie.trim()) {
      localStorage.setItem("cf_clearance_cookie", cookie.trim());
    }

    try {
      const res = await fetch("/api/badges/spoof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          cookie: cookie.trim(),
          mode: cat.spoofMode,
          gameCount,
          hoursPerGame,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل في إرسال طلب التطوير");
      }

      // Set cooldown
      const end = Date.now() + COOLDOWN_MS;
      localStorage.setItem(COOLDOWN_KEY, String(end));
      setCooldownEnd(end);

      setUpgradeResult({
        success: true,
        message: `تم إرسال طلب تطوير شارة "${cat.titleAr}" إلى اللفل الأخير (${lastTier.nameAr}) بنجاح! تم معالجة ${data.sentGames} لعبة. انتظر مدة لا تقل عن يومان (48 ساعة) لتحديث الشارة على حسابك.`,
      });
    } catch (err: any) {
      setUpgradeResult({
        success: false,
        message: err.message || "حدث خطأ غير متوقع",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const activeCategory = BADGE_CATEGORIES.find((c) => c.id === selectedCategory)!;
  const activeTier = activeCategory.tiers[selectedTierIdx];
  const lastTier = activeCategory.tiers[activeCategory.tiers.length - 1];
  const isOnCooldown = cooldownEnd !== null && cooldownEnd > Date.now();
  const isDisplayOnly = selectedCategory === "account-age";
  const isComingSoon = Boolean(activeCategory.isComingSoon);

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "webp"}?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user?.id ?? "0") % 5}.png`;

  const avatarDecorationUrl = user?.avatar_decoration_data?.asset
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png`
    : null;

  const bannerUrl = user?.banner
    ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner.startsWith("a_") ? "gif" : "webp"}?size=600`
    : null;

  const userFlags = (user?.public_flags ?? 0) | (user?.flags ?? 0);
  const userBadges = FLAG_BADGES.filter((b) => (userFlags & b.flag) !== 0);
  const premiumBadge = PREMIUM_BADGES.find((b) => b.type === (user?.premium_type ?? 0));
  const fallbackBadges = [
    ...(premiumBadge ? [{ id: "nitro", label: premiumBadge.label, labelAr: premiumBadge.labelAr, description: premiumBadge.labelAr, icon: premiumBadge.icon }] : []),
    ...userBadges.map((b) => ({ id: String(b.flag), label: b.label, labelAr: b.labelAr, description: b.labelAr, icon: b.icon })),
  ];

  const displayedBadges = discordBadges.length > 0
    ? discordBadges.map((b) => ({
      id: b.id,
      label: b.description || b.id,
      labelAr: b.description || b.id,
      description: b.description || b.id,
      icon: b.icon,
    }))
    : fallbackBadges;

  return (
    <main
      className="min-h-screen flex flex-col items-center relative overflow-x-hidden text-white pb-16"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a4e 0%, #06061a 75%)",
      }}
    >
      {/* ── TOP NAV ── */}
      <nav className="w-full h-24 flex items-center justify-center relative px-6 md:px-12 z-20">
        {/* العودة للرئيسية — أقصى اليمين */}
        <Link
          href="/"
          className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all flex items-center gap-2 group text-sm md:text-base font-semibold select-none"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          <span>العودة للرئيسية</span>
        </Link>

        {/* الروابط في المنتصف تماماً */}
        <div
          className="flex items-center gap-6 text-base md:text-lg"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          <Link
            href="/how-it-works"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            كيف يعمل
          </Link>
          <span className="text-white/30 select-none tracking-widest">─ · ─</span>
          <Link
            href="/tool"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            المهام
          </Link>
          <span className="text-white/30 select-none tracking-widest">─ · ─</span>
          <Link
            href="/faq"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            أسئلة شائعة
          </Link>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="flex flex-col items-center text-center px-4 w-full max-w-6xl mt-6 md:mt-10 z-10">
        {/* Page title */}
        <h1
          className="text-4xl md:text-6xl font-bold tracking-tight mb-3"
          style={{
            fontFamily: "'Lifta', sans-serif",
            textShadow: "0 0 30px rgba(88,101,242,0.4)",
          }}
        >
          تطوير الشارات
        </h1>
        <p
          className="text-base md:text-lg text-gray-300 mb-10 max-w-xl leading-relaxed"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          طوّر شارات بروفايلك في ديسكورد تلقائياً بضغطة زر
        </p>

        {/* ── TOKEN INPUT (if not logged in) ── */}
        {!user ? (
          <div
            className="w-full max-w-lg p-8 rounded-3xl border border-white/10 text-right"
            style={{
              background: "linear-gradient(135deg, rgba(88,101,242,0.08) 0%, rgba(10,10,30,0.6) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            <h2
              className="text-xl font-bold text-white mb-6 text-center"
              style={{ fontFamily: "'Lifta', sans-serif" }}
            >
              تسجيل الدخول
            </h2>

            <div className="relative mb-4">
              <input
                type="password"
                placeholder="أدخل التوكن الخاص بك..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-right placeholder-gray-500 outline-none focus:border-[#5865F2]/50 transition-all"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              />
            </div>

            {errorMsg && (
              <p className="text-red-400 text-sm mb-4 text-center" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                {errorMsg}
              </p>
            )}

            <button
              onClick={() => handleLogin()}
              disabled={loadingAuth}
              className="w-full py-3.5 rounded-xl font-bold text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'Lifta', sans-serif",
                background: "linear-gradient(135deg, #5865F2, #404EED)",
                boxShadow: "0 4px 15px rgba(88,101,242,0.4)",
              }}
            >
              {loadingAuth ? "جاري التحقق..." : "فحص والاتصال"}
            </button>
          </div>
        ) : (
          /* ── MAIN CONTENT: Profile + Badges ── */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ── LEFT: Profile Card ── */}
            <div className="lg:col-span-4">
              <div
                className="rounded-3xl border border-white/10 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(88,101,242,0.06) 0%, rgba(10,10,30,0.7) 100%)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Banner */}
                <div
                  className="w-full h-28 relative"
                  style={{
                    background: bannerUrl
                      ? `url(${bannerUrl}) center/cover`
                      : user.banner_color || "#5865F2",
                  }}
                />

                {/* Avatar with optional decoration */}
                <div className="relative px-5 -mt-12 flex items-center justify-between">
                  <div className="relative w-[92px] h-[92px]">
                    <div className="w-[88px] h-[88px] rounded-full border-4 border-[#0a0a1e] overflow-hidden bg-[#1a1a3e]">
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {avatarDecorationUrl && (
                      <img
                        src={avatarDecorationUrl}
                        alt="Decoration"
                        className="absolute -top-[10px] -left-[10px] w-[108px] h-[108px] pointer-events-none z-10"
                      />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="px-5 pt-3 pb-5">
                  <h3
                    className="text-xl font-bold text-white text-left tracking-wide"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    {user.global_name || user.username}
                  </h3>
                  <p className="text-sm text-gray-400 text-left font-sans">
                    @{user.username}
                  </p>

                  {/* Discord Official-Style Badge Pill Bar */}
                  {displayedBadges.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-[#070716]/90 border border-white/10 w-fit">
                      {displayedBadges.map((b, i) => (
                        <div
                          key={`${b.id}-${i}`}
                          className="group relative flex items-center justify-center p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <img
                            src={b.icon}
                            alt={b.description || b.label}
                            className="w-5 h-5 object-contain"
                          />
                          {/* Discord-style tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                            <span className="bg-[#111214] text-white text-[11px] font-sans px-2.5 py-1 rounded-md shadow-xl border border-white/15 whitespace-nowrap">
                              {b.description || b.label}
                            </span>
                            <span className="w-2 h-1 bg-[#111214] border-b border-r border-white/15 rotate-45 -mt-0.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Badge list summary */}
                  {displayedBadges.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-400 mb-2 text-left" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                        الشارات المكتشفة ({displayedBadges.length})
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {displayedBadges.map((b, i) => (
                          <div
                            key={`detail-${b.id}-${i}`}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5 text-left"
                          >
                            <img src={b.icon} alt={b.description || b.label} className="w-4 h-4 object-contain flex-shrink-0" />
                            <span className="text-xs text-gray-300 truncate font-sans">
                              {b.description || b.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {displayedBadges.length === 0 && (
                    <p className="mt-4 text-xs text-gray-500 text-left" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                      لا توجد شارات ظاهرة حالياً على حسابك
                    </p>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>

              {/* Optional Cookie Settings */}
              <div
                className="mt-4 rounded-2xl border border-white/10 p-5"
                style={{
                  background: "rgba(10,10,30,0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    تلقائي ✨
                  </span>
                  <label
                    className="block text-sm font-semibold text-gray-300 text-right"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    كوكي الحماية (اختياري)
                  </label>
                </div>
                <p className="text-xs text-gray-400 mb-3 text-right leading-relaxed" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                  النظام يقوم بتخطي الكوكي ومحاكاة تطبيق الديسكورد تلقائياً! لن تحتاج لوضع الكوكي إلا إذا طلب ديسكورد ذلك.
                </p>
                <textarea
                  rows={2}
                  placeholder="اتركه فارغاً (أو الصقه إذا طلب النظام ذلك)..."
                  value={cookie}
                  onChange={(e) => {
                    setCookie(e.target.value);
                    if (e.target.value.trim()) {
                      localStorage.setItem("cf_clearance_cookie", e.target.value.trim());
                    } else {
                      localStorage.removeItem("cf_clearance_cookie");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-right placeholder-gray-500 outline-none focus:border-[#5865F2]/50 transition-all text-xs resize-none"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                />
              </div>
            </div>

            {/* ── RIGHT: Badge Upgrade Cards ── */}
            <div className="lg:col-span-8">
              {/* Category Tabs */}
              <div className="flex gap-3 mb-6 justify-center">
                {BADGE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedTierIdx(0);
                      setUpgradeResult(null);
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer select-none ${selectedCategory === cat.id
                        ? "text-white shadow-[0_0_20px_rgba(88,101,242,0.5)] scale-[1.02]"
                        : "text-gray-400 hover:text-white hover:bg-white/5 opacity-80"
                      }`}
                    style={{
                      fontFamily: "'Lifta', sans-serif",
                      background:
                        selectedCategory === cat.id
                          ? "linear-gradient(135deg, #5865F2 0%, #404EED 100%)"
                          : "rgba(10,10,30,0.45)",
                      border:
                        selectedCategory === cat.id
                          ? "1px solid rgba(255,255,255,0.3)"
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span>{cat.titleAr}</span>
                    {cat.isComingSoon && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-sans font-semibold">
                        قريباً
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Category description */}
              <p
                className="text-center text-gray-400 text-sm mb-6"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                {activeCategory.description}
              </p>

              {/* Tiers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
                {activeCategory.tiers.map((tier, idx) => (
                  <button
                    key={tier.name}
                    onClick={() => {
                      setSelectedTierIdx(idx);
                      setUpgradeResult(null);
                    }}
                    className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl cursor-pointer select-none transition-all duration-300 ${selectedTierIdx === idx
                        ? "scale-[1.05] shadow-[0_0_25px_rgba(88,101,242,0.5)]"
                        : "opacity-70 hover:opacity-100 hover:bg-white/5"
                      }`}
                    style={{
                      background:
                        selectedTierIdx === idx
                          ? "linear-gradient(135deg, rgba(88,101,242,0.2), rgba(10,10,30,0.8))"
                          : "rgba(10,10,30,0.4)",
                      border:
                        selectedTierIdx === idx
                          ? "1px solid rgba(88,101,242,0.5)"
                          : "1px solid rgba(255,255,255,0.06)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img
                        src={tier.icon}
                        alt={tier.name}
                        className="w-10 h-10 drop-shadow-[0_0_8px_rgba(88,101,242,0.4)]"
                      />
                    </div>
                    <span
                      className="text-xs font-bold text-white"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      {tier.nameAr}
                    </span>
                    <span className="text-[10px] text-gray-500">{tier.name}</span>
                  </button>
                ))}
              </div>

              {/* Selected Tier Detail Card */}
              <div
                className="w-full p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, rgba(88,101,242,0.08) 0%, rgba(10,10,30,0.6) 100%)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Ambient glow */}
                <div
                  className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
                  style={{ background: "#5865F2", opacity: 0.2 }}
                />

                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  {/* Badge icon large */}
                  <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={activeTier.icon}
                      alt={activeTier.name}
                      className="w-20 h-20 drop-shadow-[0_0_20px_rgba(88,101,242,0.5)]"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-right">
                    <div className="flex items-center justify-center md:justify-end gap-3 mb-2">
                      <span
                        className="text-xs px-3 py-1 rounded-full bg-[#5865F2]/20 text-[#7289da] font-semibold border border-[#5865F2]/30"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        المستوى {selectedTierIdx + 1} من {activeCategory.tiers.length}
                      </span>
                    </div>
                    <h3
                      className="text-2xl font-bold text-white mb-1"
                      style={{ fontFamily: "'Lifta', sans-serif" }}
                    >
                      {activeTier.nameAr}
                    </h3>
                    <p className="text-sm text-gray-400" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                      {activeTier.name} · المطلوب: {activeTier.requirement}
                    </p>

                    {/* Max Level Target Banner */}
                    <div className="mt-4 p-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/25 flex items-center justify-between gap-3 text-right">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={lastTier.icon}
                          alt={lastTier.name}
                          className="w-8 h-8 drop-shadow-[0_0_8px_rgba(88,101,242,0.6)] flex-shrink-0"
                        />
                        <div className="text-right">
                          <span className="text-[11px] text-[#7289da] font-semibold block">
                            الترقية دائماً إلى اللفل الأخير (Max Level)
                          </span>
                          <span className="text-xs font-bold text-white">
                            المستوى 10: {lastTier.nameAr} ({lastTier.requirement})
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded bg-[#5865F2]/30 text-white font-bold whitespace-nowrap">
                        أعلى لفل
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upgrade Button / Cooldown / Result */}
                <div className="mt-6 relative z-10">
                  {upgradeResult && (
                    <div
                      className={`mb-4 p-4 rounded-xl text-sm text-right leading-relaxed ${upgradeResult.success
                          ? "bg-green-500/10 border border-green-500/30 text-green-300"
                          : "bg-red-500/10 border border-red-500/30 text-red-300"
                        }`}
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      {upgradeResult.message}
                    </div>
                  )}

                  {isComingSoon ? (
                    <div
                      className="w-full py-5 rounded-2xl text-center bg-amber-500/10 border border-amber-500/25"
                    >
                      <span className="text-2xl block mb-1">⏳</span>
                      <p
                        className="text-lg text-amber-300 font-bold"
                        style={{ fontFamily: "'Lifta', sans-serif" }}
                      >
                        قريباً...
                      </p>
                      <p
                        className="text-xs text-gray-300 mt-1 max-w-sm mx-auto leading-relaxed"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        ميزة تطوير شارة البث المباشر قيد التطوير وستتوفر قريباً بمجرد اكتمال محاكي الاتصال الصوتي.
                      </p>
                    </div>
                  ) : isDisplayOnly ? (
                    <div
                      className="w-full py-4 rounded-xl text-center"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p
                        className="text-sm text-gray-400 font-semibold"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        هذه الشارة تعتمد على عمر حسابك الفعلي ولا يمكن تطويرها
                      </p>
                    </div>
                  ) : isOnCooldown ? (
                    <div
                      className="w-full py-4 rounded-xl text-center"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <p
                        className="text-sm text-gray-400 font-semibold"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        قيد المعالجة في ديسكورد
                      </p>
                      <p
                        className="text-lg font-bold text-[#7289da] mt-1"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        {cooldownRemaining}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-1"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        انتظر حتى ينتهي الوقت لتتمكن من التطوير مرة أخرى
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setErrorMsg(null);
                        setShowConfirm(true);
                      }}
                      disabled={upgrading}
                      className="w-full py-4 rounded-xl font-bold text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        fontFamily: "'Lifta', sans-serif",
                        fontSize: "17px",
                        background: upgrading
                          ? "rgba(88,101,242,0.3)"
                          : "linear-gradient(135deg, #5865F2, #404EED)",
                        boxShadow: upgrading ? "none" : "0 6px 20px rgba(88,101,242,0.4)",
                      }}
                    >
                      {upgrading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          جاري التطوير للفل الأخير...
                        </span>
                      ) : (
                        `تطوير الشارة للحد الأقصى (${lastTier.nameAr})`
                      )}
                    </button>
                  )}

                  {errorMsg && !upgradeResult && (
                    <p
                      className="text-red-400 text-sm mt-3 text-center"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      {errorMsg}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CONFIRM MODAL ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md mx-4 p-8 rounded-3xl border border-white/15 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(15,15,40,0.98), rgba(10,10,30,0.98))",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <img
                src={lastTier.icon}
                alt={lastTier.name}
                className="w-14 h-14 drop-shadow-[0_0_15px_rgba(88,101,242,0.5)]"
              />
            </div>

            <h3
              className="text-xl font-bold text-white mb-2"
              style={{ fontFamily: "'Lifta', sans-serif" }}
            >
              تأكيد الترقية للفل الأخير
            </h3>
            <p
              className="text-sm text-gray-300 mb-6 leading-relaxed"
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              هل أنت متأكد من تطوير شارة <strong className="text-[#7289da]">{activeCategory.titleAr}</strong> مباشرة إلى أعلى مستوى:{" "}
              <strong className="text-white">{lastTier.nameAr}</strong> ({lastTier.requirement})؟
              <br />
              <span className="text-gray-400 text-xs mt-2 block">
                بعد التأكيد ستبدأ المعالجة ولن تتمكن من التطوير مرة أخرى لمدة 48 ساعة.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all cursor-pointer"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpgrade}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                style={{
                  fontFamily: "'Lifta', sans-serif",
                  background: "linear-gradient(135deg, #5865F2, #404EED)",
                  boxShadow: "0 4px 15px rgba(88,101,242,0.4)",
                }}
              >
                تأكيد التطوير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer
        className="mt-20 flex flex-col items-center justify-center gap-2 select-none z-10"
        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="https://facebook.com/j1slc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a
            href="https://instagram.com/j1slc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-[#E4405F]/10 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>
        <p className="text-[12px] md:text-[13px] text-white/50 tracking-wider">
          Copyrights © Quester | 2026. All rights reserved. made by{" "}
          <span className="text-[#5865F2] font-semibold">Jio</span>
        </p>
      </footer>
    </main>
  );
}

