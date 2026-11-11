"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
  flags?: number;
  public_flags?: number;
}

interface HouseOption {
  id: number;
  nameAr: string;
  nameEn: string;
  svg: string;
  color: string;
  glowColor: string;
  borderColor: string;
  bgGradient: string;
  tagline: string;
  description: string;
}

const HOUSES: HouseOption[] = [
  {
    id: 1,
    nameAr: "بيت الشجاعة",
    nameEn: "House of Bravery",
    svg: "/badges/hype-squad-bravery.svg",
    color: "#9c84ef",
    glowColor: "rgba(156, 132, 239, 0.45)",
    borderColor: "rgba(156, 132, 239, 0.7)",
    bgGradient: "linear-gradient(180deg, rgba(156, 132, 239, 0.18) 0%, rgba(20, 16, 45, 0.8) 100%)",
    tagline: "الشجاعة والإقدام والتفاؤل",
    description: "للأعضاء الجريئين الذين يقودون المواجهات بثقة وعزيمة لا تلين.",
  },
  {
    id: 2,
    nameAr: "بيت التألق والذكاء",
    nameEn: "House of Brilliance",
    svg: "/badges/hype-squad-brilliance.svg",
    color: "#f47b67",
    glowColor: "rgba(244, 123, 103, 0.45)",
    borderColor: "rgba(244, 123, 103, 0.7)",
    bgGradient: "linear-gradient(180deg, rgba(244, 123, 103, 0.18) 0%, rgba(45, 20, 20, 0.8) 100%)",
    tagline: "الصبر والتفكير الاستراتيجي",
    description: "لأصحاب العقول الصبورة والمبتكرة التي تبني الحلول الذكية باحتراف.",
  },
  {
    id: 3,
    nameAr: "بيت التوازن",
    nameEn: "House of Balance",
    svg: "/badges/hype-squad-balance.svg",
    color: "#45ddc0",
    glowColor: "rgba(69, 221, 192, 0.45)",
    borderColor: "rgba(69, 221, 192, 0.7)",
    bgGradient: "linear-gradient(180deg, rgba(69, 221, 192, 0.18) 0%, rgba(12, 35, 30, 0.8) 100%)",
    tagline: "السلام والحكمة والانسجام",
    description: "لأصحاب العقول المتزنة الذين ينشرون الاستقرار ويوازنون الأمور بهدوء.",
  },
];

export default function BadgesPage() {
  const [token, setToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [currentHouse, setCurrentHouse] = useState<number | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<number | "leave" | null>(null);

  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Quester — الشارات";

    // Auto-load remembered token
    try {
      const savedToken = localStorage.getItem("quester_discord_token");
      if (savedToken) {
        setToken(savedToken);
      }
    } catch {
      // localStorage may fail in private mode
    }
  }, []);

  // Login handler
  const handleLogin = async (overrideToken?: string) => {
    const rawToken = (overrideToken || token).trim().replace(/^["']|["']$/g, "");
    if (!rawToken) {
      setErrorMsg("الرجاء إدخال رمز التوكن (Token) الخاص بحسابك.");
      return;
    }

    setLoadingAuth(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: rawToken, action: "check" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "التوكن غير صالح أو انتهت صلاحيته. تأكد من نسخه بشكل صحيح.");
      }

      // Save to localStorage if rememberMe is enabled
      try {
        if (rememberMe) {
          localStorage.setItem("quester_discord_token", rawToken);
        } else {
          localStorage.removeItem("quester_discord_token");
        }
      } catch {
        // ignore
      }

      setUser(data.user);
      setCurrentHouse(data.currentHouse);
      // Auto-select their current house or house 1
      if (data.currentHouse) {
        setSelectedHouse(data.currentHouse);
      } else {
        setSelectedHouse(1);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء فحص التوكن");
    } finally {
      setLoadingAuth(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUser(null);
    setCurrentHouse(null);
    setSelectedHouse(null);
    setToken("");
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      localStorage.removeItem("quester_discord_token");
    } catch {
      // ignore
    }
  };

  // Submit badge change or removal
  const handleSubmit = async () => {
    const rawToken = token.trim().replace(/^["']|["']$/g, "");
    if (!rawToken) {
      setErrorMsg("يرجى إدخال التوكن أولاً.");
      return;
    }

    if (selectedHouse === null) {
      setErrorMsg("يرجى تحديد الشارة التي تريدها أولاً.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const isLeave = selectedHouse === "leave";
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: rawToken,
          action: isLeave ? "leave" : "set",
          houseId: isLeave ? undefined : selectedHouse,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تطبيق العملية على حسابك");
      }

      setUser(data.user);
      setCurrentHouse(data.currentHouse);
      setStatusMsg(data.message || "تم تحديث الشارة في حسابك بنجاح!");
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء تحديث الشارة");
    } finally {
      setSubmitting(false);
    }
  };


  const currentHouseObj = HOUSES.find((h) => h.id === currentHouse);
  const selectedHouseObj = typeof selectedHouse === "number" ? HOUSES.find((h) => h.id === selectedHouse) : null;

  return (
    <main
      className="min-h-screen flex flex-col items-center relative overflow-x-hidden text-white pb-20"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a4e 0%, #06061a 75%)",
      }}
    >
      {/* ── TOP NAV ── */}
      <nav className="w-full h-24 flex items-center justify-center relative px-6 md:px-12 z-20">
        {/* العودة — أقصى اليمين */}
        <Link
          href="/"
          className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all flex items-center gap-2 group text-sm md:text-base font-semibold select-none"
          style={{ fontFamily: "'Lifta', sans-serif" }}
          aria-label="العودة"
        >
          <span className="text-2xl sm:text-xl group-hover:translate-x-1 transition-transform">→</span>
          <span className="hidden sm:inline">العودة</span>
        </Link>

        {/* الروابط في المنتصف تماماً */}
        <div
          className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base md:text-lg"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          <Link
            href="/quests"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            المهام
          </Link>
          <span className="text-white/30 select-none tracking-widest">─ · ─</span>
          <Link
            href="/how-it-works"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            كيف يعمل
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

      {/* ── MAIN CONTAINER ── */}
      <div className="w-full max-w-5xl px-4 md:px-6 mt-4 flex flex-col items-center z-10">


        {/* Error Alert */}
        {errorMsg && (
          <div
            className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-sm flex items-center justify-between animate-shake shadow-lg"
            dir="rtl"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Alert */}
        {statusMsg && (
          <div
            className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between shadow-lg"
            dir="rtl"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">✓</span>
              <span className="font-semibold">{statusMsg}</span>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── STEP 1: LOGIN WITH TOKEN CARD (مطابقة لصفحة المهام 100%) ── */}
        {!user ? (
          <div
            className="w-full max-w-xl p-8 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
            style={{
              background: "radial-gradient(circle at 50% 10%, #202058 0%, #0c0c24 100%)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(88, 101, 242, 0.25)",
            }}
            dir="rtl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center overflow-hidden">
                <img src="/hashtag.png" alt="token" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Lifta', sans-serif" }}>
                  إدخال توكن الديسكورد (Discord Token)
                </h2>
                <p className="text-xs text-gray-400">لن يتم حفظ التوكن على أي خادم خارجي، يعمل بأمان كامل.</p>
              </div>
            </div>

            <div className="relative mb-5">
              <label className="block text-xs text-gray-300 mb-2 font-semibold">
                التوكن الخاص بحسابك:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                  placeholder=""
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/40 text-sm font-mono tracking-wider transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="cursor-pointer transition-opacity hover:opacity-80 shrink-0"
                >
                  <img
                    src={showToken ? "/switch_enabled.png" : "/switch_disabled.png"}
                    alt={showToken ? "إخفاء" : "إظهار"}
                    className="w-12 h-7 object-contain"
                  />
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="mb-4 flex items-center justify-between text-xs text-gray-300 select-none">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#5865F2] focus:ring-[#5865F2]/50 accent-[#5865F2] cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">تذكر التوكن في هذا المتصفح</span>
              </label>
              <span className="text-[11px] text-gray-500">مشفر محلياً في جهازك</span>
            </div>

            {/* Quick guide link */}
            <div className="mb-6 flex items-center justify-between text-xs text-gray-400">
              <span>لا تعرف كيف تستخرج التوكن؟</span>
              <Link
                href="/how-it-works"
                className="text-[#5865F2] hover:text-[#7289da] font-semibold underline underline-offset-4 transition-colors"
              >
                شاهد شرح الاستخراج بالفيديو ←
              </Link>
            </div>

            {/* Login button */}
            <button
              onClick={() => handleLogin()}
              disabled={loadingAuth}
              className="w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#5865F2]/40 flex items-center justify-center gap-2"
              style={{
                fontFamily: "'Lifta', sans-serif",
                background: "linear-gradient(135deg, #5865F2 0%, #3c45a5 100%)",
                fontSize: "18px",
              }}
            >
              {loadingAuth ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحقق وقراءة الشارات...</span>
                </>
              ) : (
                <span>تسجيل الدخول وعرض الشارات ←</span>
              )}
            </button>
          </div>
        ) : (
          /* ── STEP 2: DASHBOARD VIEW (عند تسجيل الدخول) ── */
          <div className="w-full space-y-8" dir="rtl">

            {/* ── LIVE PREVIEW & USER INFO (TOP) ── */}
            <div className="w-full flex flex-col lg:flex-row items-center gap-8 p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#131535]/80 to-[#0a0b1e]/90 border border-[#5865F2]/30 backdrop-blur-xl shadow-2xl">
              {/* Left: Discord Mini Profile Preview */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="text-center mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    معاينة البروفايل في ديسكورد
                  </span>
                </div>

                {/* Mockup Discord Profile Card */}
                <div className="rounded-2xl bg-[#111214] border border-white/10 overflow-hidden shadow-2xl relative select-none">
                  {/* Banner */}
                  <div
                    className="h-20 w-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        selectedHouseObj?.color ||
                        currentHouseObj?.color ||
                        "#5865F2",
                      opacity: 0.85,
                    }}
                  />

                  {/* Avatar & Badges row */}
                  <div className="px-4 pb-4 relative">
                    <div className="flex items-end justify-between -mt-9 mb-3">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full border-4 border-[#111214] overflow-hidden bg-[#2b2d31] relative shadow-md">
                        {user.avatar ? (
                          <img
                            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-white text-xl bg-[#5865F2]">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111214]" />
                      </div>

                      {/* Profile Badges Bar */}
                      <div className="flex items-center gap-1.5 bg-[#232428] px-2.5 py-1 rounded-lg border border-white/5">
                        {selectedHouse === "leave" ? (
                          <span className="text-[10px] text-gray-500">لا توجد شارة</span>
                        ) : selectedHouseObj ? (
                          <div className="flex items-center gap-1" title={selectedHouseObj.nameAr}>
                            <img
                              src={selectedHouseObj.svg}
                              alt={selectedHouseObj.nameAr}
                              className="w-5 h-5 drop-shadow animate-bounce"
                            />
                          </div>
                        ) : currentHouseObj ? (
                          <div className="flex items-center gap-1" title={currentHouseObj.nameAr}>
                            <img
                              src={currentHouseObj.svg}
                              alt={currentHouseObj.nameAr}
                              className="w-5 h-5 drop-shadow"
                            />
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500">لا توجد شارة</span>
                        )}
                      </div>
                    </div>

                    {/* Names */}
                    <h4 className="font-bold text-white text-base leading-tight">
                      {user.global_name || user.username}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mb-3" dir="ltr">
                      @{user.username}
                    </p>

                    {/* House Info pill */}
                    <div className="p-2.5 rounded-xl bg-[#1e1f22] border border-white/5 text-xs text-gray-300">
                      <span className="text-gray-400 block text-[11px] mb-1">البيت المحدد:</span>
                      {selectedHouse === "leave" ? (
                        <span className="text-red-400 font-bold">سيتم إزالة الشارة من الحساب</span>
                      ) : selectedHouseObj ? (
                        <span className="font-bold" style={{ color: selectedHouseObj.color }}>
                          {selectedHouseObj.nameAr} ({selectedHouseObj.nameEn})
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">اختر شارة للتطبيق</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Action Button & Info */}
              <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-right">
                <h3
                  className="text-2xl font-bold mb-2 text-white"
                  style={{ fontFamily: "'Lifta', sans-serif" }}
                >
                  جاهز لتحديث بروفايلك؟
                </h3>
                <p className="text-gray-300 text-sm mb-6 max-w-lg leading-relaxed">
                  بمجرد الضغط على الزر، سيتم إرسال الطلب فوراً إلى سيرفرات ديسكورد الرسمية وتحديث
                  الشارة على بروفايلك في ثوانٍ معدودة!
                </p>

                {/* The Big Action Button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedHouse}
                  className="w-full sm:w-auto relative group overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 select-none shadow-xl cursor-pointer"
                >
                  <span
                    className="absolute inset-0 rounded-full blur-md opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{
                      background:
                        selectedHouse === "leave"
                          ? "linear-gradient(90deg, #ef4444, #b91c1c)"
                          : selectedHouseObj
                            ? `linear-gradient(90deg, ${selectedHouseObj.color}, #5865F2)`
                            : "linear-gradient(90deg, #5865F2, #7289da)",
                    }}
                  />

                  <span
                    className="relative flex items-center justify-center px-10 py-4 md:px-14 md:py-4.5 rounded-full text-white font-bold text-base md:text-lg min-w-[260px] transition-all"
                    style={{
                      fontFamily: "'Lifta', sans-serif",
                      background:
                        selectedHouse === "leave"
                          ? "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)"
                          : selectedHouseObj
                            ? `linear-gradient(180deg, ${selectedHouseObj.color} 0%, #353880 100%)`
                            : "linear-gradient(180deg, #5865F2 0%, #3c45a5 100%)",
                      boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                    }}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-3">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جارٍ تحديث الشارة في ديسكورد...</span>
                      </span>
                    ) : selectedHouse === "leave" ? (
                      <span>تأكيد إزالة الشارة الآن 🗑️</span>
                    ) : selectedHouseObj ? (
                      <span>تفعيل {selectedHouseObj.nameAr} الآن ✨</span>
                    ) : (
                      <span>اختر شارة أولاً</span>
                    )}
                  </span>
                </button>

                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>إذا لم تظهر الشارة فوراً، اضغط (Ctrl + R) داخل تطبيق ديسكورد لإعادة التحميل.</span>
                </p>

                {/* Action buttons row */}
                <div className="flex flex-wrap items-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `قمت بتعيين شارة ديسكورد الرسمية عبر منصة Quester! جربها الآن: ${window.location.origin}/badges`;
                      navigator.clipboard.writeText(shareText);
                      setCopiedShare(true);
                      setTimeout(() => setCopiedShare(false), 2500);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{copiedShare ? "تم نسخ الرابط ✓" : "مشاركة الأداة 🔗"}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs md:text-sm font-semibold transition-all cursor-pointer"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </div>

            {/* ── BADGES SELECTION GRID ── */}
            <div className="w-full p-6 md:p-8 rounded-3xl bg-[#0b0c22]/80 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-sm font-bold text-[#7289da]">
                    ✨
                  </span>
                  <div>
                    <h2
                      className="text-xl md:text-2xl font-bold text-white"
                      style={{ fontFamily: "'Lifta', sans-serif" }}
                    >
                      اختر شارة الـهايبسكواد  التي تريدها
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      انقر على البيت الذي تفضله، أو يمكنك إزالة الشارة تماماً إذا كنت ترغب بذلك
                    </p>
                  </div>
                </div>
              </div>

              {/* Houses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {HOUSES.map((house) => {
                  const isSelected = selectedHouse === house.id;
                  const isCurrent = currentHouse === house.id;

                  return (
                    <div
                      key={house.id}
                      onClick={() => setSelectedHouse(house.id)}
                      className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col items-center text-center select-none overflow-hidden ${isSelected
                        ? "scale-[1.02] shadow-2xl"
                        : "hover:scale-[1.01] hover:border-white/30 border-white/10 bg-black/40"
                        }`}
                      style={{
                        background: isSelected ? house.bgGradient : "rgba(10, 10, 28, 0.6)",
                        borderColor: isSelected ? house.borderColor : undefined,
                        boxShadow: isSelected ? `0 0 35px ${house.glowColor}` : undefined,
                      }}
                    >
                      {/* Indicator Pills */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        {isCurrent ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            شارتك الحالية ✓
                          </span>
                        ) : (
                          <span />
                        )}

                        {/* Radio circle */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-white bg-white" : "border-white/40 bg-black/40"
                            }`}
                        >
                          {isSelected && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: house.color }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Badge Icon */}
                      <div className="mt-4 mb-5 relative">
                        <div
                          className="absolute inset-0 rounded-full blur-xl transition-all duration-300 group-hover:scale-125 opacity-70"
                          style={{ backgroundColor: house.glowColor }}
                        />
                        <img
                          src={house.svg}
                          alt={house.nameAr}
                          className="w-20 h-20 relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>

                      {/* Badge Title */}
                      <h3
                        className="text-xl font-bold mb-1"
                        style={{ color: house.color, fontFamily: "'Lifta', sans-serif" }}
                      >
                        {house.nameAr}
                      </h3>
                      <span className="text-xs text-gray-400 font-mono mb-2" dir="ltr">
                        {house.nameEn}
                      </span>

                      {/* Tagline */}
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full mb-3"
                        style={{
                          color: house.color,
                          backgroundColor: `${house.color}18`,
                          border: `1px solid ${house.color}35`,
                        }}
                      >
                        {house.tagline}
                      </span>

                      {/* Description */}
                      <p className="text-xs text-gray-300 leading-relaxed mt-auto">
                        {house.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Option: Leave / Remove Badge */}
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🗑️</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">إزالة شارة HypeSquad من حسابي</p>
                    <p className="text-xs text-gray-400">
                      حذف أي شارة HypeSquad حالية والعودة للوضع الطبيعي بدون شارة. ( لا ينصح بهذا الاختيار لأنها نادرة و ستمسح فاي وقت )
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedHouse("leave")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border select-none cursor-pointer ${selectedHouse === "leave"
                    ? "bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-white/5 border-white/15 text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {selectedHouse === "leave" ? "تم تحديد الإزالة ✓" : "تحديد إزالة الشارة"}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer
        className="w-full flex flex-col items-center justify-center gap-2 select-none z-10 mt-16 pb-6"
        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
      >
        {/* Social Links */}
        <div className="flex items-center gap-3">
          {/* Discord */}
          <a
            href="https://discord.gg/Yeb9bRX7Qf"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#5865F2] hover:border-[#5865F2]/50 hover:bg-[#5865F2]/10 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@j1slc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-[#FF0000] hover:border-[#FF0000]/50 hover:bg-[#FF0000]/10 transition-all duration-300 hover:scale-110 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* Facebook */}
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

          {/* Instagram */}
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

        {/* Copyrights */}
        <p className="text-[12px] md:text-[13px] text-white/50 tracking-wider">
          Copyrights © Quester | 2026. All rights reserved. made by{" "}
          <span className="text-[#5865F2] font-semibold">Jio</span>
        </p>
      </footer>
    </main>
  );
}
