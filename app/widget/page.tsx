"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WidgetItem {
  id: string;
  type: "stat";
  title: string;
  subtitle?: string;
  tag?: string;
}

export default function WidgetPage() {
  const [subTab, setSubTab] = useState<"board" | "activity" | "wishlist">("board");

  // Hero Card State
  const [heroTitle, setHeroTitle] = useState("");
  const [heroImage, setHeroImage] = useState("");

  // Stats Widgets List (Starts empty so user builds their own)
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [copied, setCopied] = useState(false);

  // Direct Apply with Token State
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Auto load token if already saved from /tool
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("discord_token");
      if (savedToken) {
        setToken(savedToken);
      }
    }
  }, []);

  // Generate Discord MIRA JSON payload
  const generateMiraJson = () => {
    const statsObj: Record<string, any> = {};
    widgets.slice(0, 6).forEach((w, idx) => {
      statsObj[`stat_${idx + 1}`] = {
        fields: {
          value: { presentation_type: "text", value_type: "custom_string", value: w.title || "" },
          label: { presentation_type: "text", value_type: "custom_string", value: w.subtitle || "" },
        },
      };
    });

    const payload = {
      surfaces: {
        widget_top: {
          layout: "widget_top_hero",
          components: {
            hero_image: {
              fields: {
                image: {
                  presentation_type: "image",
                  value_type: "data",
                  value: heroImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=300&fit=crop",
                },
              },
            },
            title: {
              fields: {
                text: {
                  presentation_type: "text",
                  value_type: "custom_string",
                  value: heroTitle || "",
                },
              },
            },
          },
        },
        widget_bottom: {
          layout: "widget_bottom_stats",
          components: statsObj,
        },
        add_widget_preview: {
          layout: "add_widget_preview_hero",
          components: {
            hero_image: {
              fields: {
                image: {
                  presentation_type: "image",
                  value_type: "data",
                  value: heroImage || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=300&fit=crop",
                },
              },
            },
          },
        },
      },
    };

    return JSON.stringify(payload, null, 2);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(generateMiraJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addWidget = () => {
    if (widgets.length >= 6) {
      alert("الحد الأقصى للويدجيتس الإحصائية في ديسكورد هو 6");
      return;
    }
    const newId = `w${Date.now()}`;
    setWidgets([
      ...widgets,
      {
        id: newId,
        type: "stat",
        title: "",
        subtitle: "",
        tag: "✨",
      },
    ]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const updateWidget = (id: string, field: "title" | "subtitle" | "tag", val: string) => {
    setWidgets(
      widgets.map((w) => (w.id === id ? { ...w, [field]: val } : w))
    );
  };

  // Direct Apply to Discord via Server API
  const handleDirectApply = async () => {
    if (!token.trim()) {
      setApplyError("يرجى إدخال رمز التوكن (Token) لتطبيق الويدجيت على حسابك.");
      return;
    }

    setIsApplying(true);
    setApplyError(null);
    setApplySuccess(null);

    try {
      localStorage.setItem("discord_token", token.trim());

      const res = await fetch("/api/widget/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          heroTitle: heroTitle.trim(),
          heroImage: heroImage.trim(),
          widgets,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل تطبيق الويدجيت على ديسكورد.");
      }

      setApplySuccess(
        `تم تطبيق الويدجيت بنجاح على حسابك (@${data.username})! افتح بروفايلك في ديسكورد وستجد الويدجيت ظاهرة فوراً 🎉`
      );
    } catch (err: any) {
      setApplyError(err.message || "حدث خطأ أثناء الاتصال بديسكورد.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center relative overflow-x-hidden text-white pb-20"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a4e 0%, #080820 40%, #030310 100%)",
      }}
    >
      {/* Blue Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#5865F2]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-[#404EED]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ── TOP NAV ── */}
      <nav className="w-full h-24 flex items-center justify-center relative px-6 md:px-12 z-20">
        <Link
          href="/"
          className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all flex items-center gap-2 group text-sm md:text-base font-semibold select-none"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          <span>العودة للرئيسية</span>
        </Link>

        <div
          className="flex items-center gap-6 text-base md:text-lg"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          <Link
            href="/"
            className="text-white/75 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            الرئيسية
          </Link>
          <span className="text-white/20 select-none tracking-widest">─ · ─</span>
          <Link
            href="/how-it-works"
            className="text-white/75 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            كيف يعمل
          </Link>
          <span className="text-white/20 select-none tracking-widest">─ · ─</span>
          <Link
            href="/widget"
            className="text-white font-bold transition-all duration-200 outline-none select-none drop-shadow-[0_0_14px_rgba(88,101,242,0.9)]"
            style={{ color: "#7289da" }}
          >
            ويدجيت
          </Link>
          <span className="text-white/20 select-none tracking-widest">─ · ─</span>
          <Link
            href="/faq"
            className="text-white/75 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            أسئلة شائعة
          </Link>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <div className="w-full max-w-6xl px-6 pt-4 pb-8 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/35 text-[#a5b4fc] text-xs font-semibold mb-3 tracking-wide shadow-[0_0_20px_rgba(88,101,242,0.2)]">
          <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse" />
          <span>DISCORD WIDGET ENGINE</span>
        </div>
        <h1
          className="text-4xl md:text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#7289da] via-blue-200 to-[#5865F2]"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          صانع ويدجيت ديسكورد الاحترافي
        </h1>
        <p className="text-gray-300 text-sm md:text-base max-w-xl leading-relaxed">
          صمم كروت وإحصائيات الويدجيت (Bento Board) الخاصة بحسابك، وطبّقها مباشرة على ديسكورد بضغطة زر واحدة!
        </p>
      </div>

      {/* ── MAIN CONTENT AREA (BUILDER + LIVE PREVIEW SIDE-BY-SIDE) ── */}
      <div className="w-full max-w-6xl px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT: WIDGET BUILDER & DIRECT APPLY (7 COLS) ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* DIRECT APPLY ACTION CARD */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#13163a] to-[#0a0c20] border-2 border-[#5865F2]/40 backdrop-blur-xl space-y-4 shadow-2xl shadow-[#5865F2]/15 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>تطبيق الويدجيت المباشر</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#a5b4fc] text-[10px] font-bold">
                        تلقائي 100%
                      </span>
                    </h2>
                    <p className="text-gray-400 text-xs">
                      ضع التوكن الخاص بحسابك واضغط زر التطبيق لربط الويدجيت ببروفايلك فوراً
                    </p>
                  </div>
                </div>
                <Link
                  href="/how-it-works"
                  target="_blank"
                  className="text-xs text-[#7289da] hover:underline"
                >
                  كيف أحصل على التوكن؟
                </Link>
              </div>

              {/* Token Input */}
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="الصق رمز التوكن (Token) هنا..."
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-[#5865F2]/30 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer select-none"
                >
                  {showToken ? "إخفاء" : "إظهار"}
                </button>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleDirectApply}
                disabled={isApplying}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isApplying
                    ? "bg-gray-700 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#5865F2] to-[#404EED] hover:from-[#4752c4] hover:to-[#363fbe] text-white shadow-[#5865F2]/40 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {isApplying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري إنشاء ونشر الويدجيت على بروفايلك...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>تطبيق الويدجيت على حسابي الآن</span>
                  </>
                )}
              </button>

              {/* Success / Error Messages */}
              {applySuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed flex items-center gap-2 animate-fadeIn">
                  <span className="text-lg">✓</span>
                  <span>{applySuccess}</span>
                </div>
              )}

              {applyError && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs leading-relaxed flex items-center gap-2 animate-fadeIn">
                  <span className="text-lg">⚠️</span>
                  <span>{applyError}</span>
                </div>
              )}
            </div>

            {/* Hero Card Settings */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0b0c1e]/80 border border-[#5865F2]/25 backdrop-blur-xl space-y-4 shadow-xl shadow-[#5865F2]/5">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[#a5b4fc] border-b border-white/10 pb-3">
                <span>🖼</span>
                <span>كارت الويدجيت العلوي (Hero Card)</span>
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1 text-xs">
                    النص الرئيسي / الحالة
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="مثال: خارج الاتصال، مستمع، مطور..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1 text-xs">
                    رابط صورة الكارت (Hero Image URL)
                  </label>
                  <input
                    type="text"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="رابط مباشر للصورة (مثال: https://.../image.png)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#5865F2] focus:ring-1 focus:ring-[#5865F2]"
                  />
                </div>
              </div>
            </div>

            {/* Stats Widgets Settings */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0b0c1e]/80 border border-[#5865F2]/25 backdrop-blur-xl space-y-5 shadow-xl shadow-[#5865F2]/5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-lg font-bold flex items-center gap-2 text-[#a5b4fc]">
                  <span>🧩</span>
                  <span>الويدجيتس الإحصائية ({widgets.length} من 6)</span>
                </h2>
                <div className="flex items-center gap-3">
                  {widgets.length > 0 && (
                    <button
                      onClick={() => setWidgets([])}
                      className="text-xs text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      مسح الكل
                    </button>
                  )}
                  <button
                    onClick={addWidget}
                    className="px-3.5 py-1.5 rounded-xl bg-[#5865F2]/30 hover:bg-[#5865F2]/50 border border-[#5865F2]/40 text-[#c7d2fe] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#5865F2]/20"
                  >
                    <span>+</span>
                    <span>إضافة ويدجيت</span>
                  </button>
                </div>
              </div>

              {widgets.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-dashed border-[#5865F2]/25 text-center space-y-3">
                  <span className="text-2xl block">✨</span>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    لم تقم بإضافة أي ويدجيتس إحصائية بعد.
                    <br />
                    اضغط على زر الإضافة لإنشاء ويدجيتس وإدخال بياناتك بحرية (حتى 6 ويدجيتس)!
                  </p>
                  <button
                    onClick={addWidget}
                    className="px-4 py-2 rounded-xl bg-[#5865F2]/25 hover:bg-[#5865F2]/40 border border-[#5865F2]/40 text-[#c7d2fe] text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#5865F2]/20"
                  >
                    + إضافة أول ويدجيت (1 من 6)
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {widgets.map((w, i) => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3 relative group hover:border-[#5865F2]/40 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center text-xs font-mono text-[#a5b4fc]">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={w.tag}
                        onChange={(e) => updateWidget(w.id, "tag", e.target.value)}
                        placeholder="أيقونة"
                        className="w-12 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center text-xs focus:border-[#5865F2]"
                      />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={w.title}
                          onChange={(e) => updateWidget(w.id, "title", e.target.value)}
                          placeholder="العنوان (مثال: My Server أو عدد الأعضاء)"
                          className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white focus:border-[#5865F2]"
                        />
                        <input
                          type="text"
                          value={w.subtitle}
                          onChange={(e) => updateWidget(w.id, "subtitle", e.target.value)}
                          placeholder="الوصف أو الإحصائية (مثال: 15K Members)"
                          className="w-full px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 focus:border-[#5865F2]"
                        />
                      </div>
                      <button
                        onClick={() => removeWidget(w.id)}
                        className="text-gray-500 hover:text-red-400 p-1 text-sm transition-colors cursor-pointer"
                        title="حذف"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JSON Output & Copy Section */}
            <div className="p-6 md:p-8 rounded-3xl bg-[#0b0c1e]/80 border border-[#5865F2]/25 backdrop-blur-xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">كود الإعدادات (MIRA JSON)</span>
                <button
                  onClick={handleCopyJson}
                  className="px-4 py-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#5865F2]/30 active:scale-95"
                >
                  {copied ? "تم النسخ بنجاح ✓" : "نسخ كود الـ JSON"}
                </button>
              </div>
              <textarea
                readOnly
                rows={3}
                value={generateMiraJson()}
                className="w-full p-3 rounded-xl bg-black/80 border border-white/10 text-[#c7d2fe] font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
              />
            </div>

          </div>

          {/* ── RIGHT: LIVE BENTO WIDGET PREVIEW (5 COLS) ── */}
          <div className="lg:col-span-5 sticky top-8">
            <div className="w-full rounded-3xl bg-[#0f1124] border border-[#5865F2]/35 shadow-2xl p-6 flex flex-col relative overflow-hidden shadow-[#5865F2]/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <button
                    onClick={() => setSubTab("board")}
                    className={`pb-1 transition-all border-b-2 cursor-pointer ${
                      subTab === "board"
                        ? "text-white border-[#5865F2]"
                        : "text-gray-400 border-transparent hover:text-white"
                    }`}
                  >
                    Board
                  </button>
                  <button
                    onClick={() => setSubTab("activity")}
                    className={`pb-1 transition-all border-b-2 cursor-pointer ${
                      subTab === "activity"
                        ? "text-white border-[#5865F2]"
                        : "text-gray-400 border-transparent hover:text-white"
                    }`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setSubTab("wishlist")}
                    className={`pb-1 transition-all border-b-2 cursor-pointer ${
                      subTab === "wishlist"
                        ? "text-white border-[#5865F2]"
                        : "text-gray-400 border-transparent hover:text-white"
                    }`}
                  >
                    Wishlist
                  </button>
                </div>

                <button
                  onClick={addWidget}
                  className="text-xs text-white px-3 py-1 rounded-lg bg-[#5865F2]/30 hover:bg-[#5865F2]/50 border border-[#5865F2]/40 transition-all font-semibold cursor-pointer shadow-sm shadow-[#5865F2]/20"
                >
                  + Add Widget
                </button>
              </div>

              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold block mb-3">
                Your Widgets (معاينة حية)
              </span>

              {/* Top Big Hero Widget */}
              <div className="w-full h-32 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative mb-4 flex items-center justify-between p-4 group">
                <div className="relative z-10 space-y-1">
                  <span className="text-xs text-gray-400 font-bold block">
                    Hero Widget
                  </span>
                  <h4 className="text-xl font-black text-white">
                    {heroTitle.trim() || "عنوان الكارت"}
                  </h4>
                </div>
                {heroImage.trim() ? (
                  <img
                    src={heroImage}
                    alt="Hero"
                    className="absolute right-0 top-0 bottom-0 w-44 object-cover mask-gradient"
                  />
                ) : (
                  <div className="absolute right-0 top-0 bottom-0 w-44 bg-gradient-to-l from-[#5865F2]/20 to-transparent flex items-center justify-center text-white/20 text-3xl">
                    🖼
                  </div>
                )}
              </div>

              {/* 6 Stats Widgets Grid */}
              <div className="grid grid-cols-2 gap-3 flex-1 min-h-[160px]">
                {widgets.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-gray-400 text-xs border border-dashed border-[#5865F2]/25 rounded-2xl flex flex-col items-center justify-center gap-2 bg-black/30">
                    <span className="text-2xl">✨</span>
                    <span>لم تقم بإضافة ويدجيتس بعد</span>
                    <button
                      onClick={addWidget}
                      className="mt-1 px-3.5 py-1.5 rounded-lg bg-[#5865F2]/25 hover:bg-[#5865F2]/40 text-[#c7d2fe] text-xs font-semibold cursor-pointer border border-[#5865F2]/30 transition-all"
                    >
                      + إضافة ويدجيت
                    </button>
                  </div>
                ) : (
                  widgets.map((w) => (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl bg-black/50 border border-white/10 hover:border-[#5865F2]/50 hover:shadow-[0_0_15px_rgba(88,101,242,0.25)] transition-all flex flex-col justify-between min-h-[80px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white truncate max-w-[110px]">
                          {w.title || "بدون عنوان"}
                        </span>
                        <span className="text-xs">{w.tag || "✨"}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 leading-tight block mt-2 truncate">
                        {w.subtitle || "—"}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
