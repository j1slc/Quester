"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Quest = {
  id: string;
  name: string;
  game: string;
  type: string;
  reward: string;
  rewardIcon: string;
  progress: number;
  target: number;
  color: string;
  badge: string;
};

const SAMPLE_QUESTS: Quest[] = [
  {
    id: "quest-1",
    name: "War Thunder: Play for 15 minutes",
    game: "War Thunder",
    type: "اللعب على الديسك توب",
    reward: "Exclusive Decal + شارة خاصة",
    rewardIcon: "🛡️",
    progress: 0,
    target: 15,
    color: "#5865F2",
    badge: "متاحة الآن",
  },
  {
    id: "quest-2",
    name: "Genshin Impact: Stream for 15 minutes",
    game: "Genshin Impact",
    type: "بث الشاشة في مكالمة",
    reward: "Primogems Pack + إيموجي حصري",
    rewardIcon: "✨",
    progress: 0,
    target: 15,
    color: "#00b0f4",
    badge: "شائعة جداً",
  },
  {
    id: "quest-3",
    name: "Roblox: Play with Friends",
    game: "Roblox",
    type: "نشاط لعب جماعي",
    reward: "Avatar Accessory + Nitro Booster",
    rewardIcon: "🎮",
    progress: 0,
    target: 10,
    color: "#eb459e",
    badge: "سهلة وسريعة",
  },
  {
    id: "quest-4",
    name: "Discord Nitro Special Quest",
    game: "Discord Activities",
    type: "مشاهدة بث مباشر",
    reward: "اشتراك Nitro مجاني لمدة شهر",
    rewardIcon: "💎",
    progress: 0,
    target: 20,
    color: "#57f287",
    badge: "مكافأة مميزة",
  },
];

export default function ToolPage() {
  const [step, setStep] = useState<"token" | "quests" | "running">("token");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest>(SAMPLE_QUESTS[0]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString("ar-EG")}] ${msg}`,
      ...prev,
    ]);
  };

  const handleStartShowcase = () => {
    setStep("quests");
  };

  const handleStartSimulatedQuest = (quest: Quest) => {
    setSelectedQuest(quest);
    setCurrentProgress(0);
    setIsDone(false);
    setLogs([]);
    setStep("running");

    addLog(`بدء محاكاة مهمة: ${quest.name}`);
    addLog("الاتصال الآمن بالخادم الافتراضي...");

    let p = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      p += 1;
      setCurrentProgress(p);

      if (p === 3) {
        addLog("تم التحقق من الجلسة ومطابقة بيانات المهمة بنجاح ✅");
      } else if (p === 7) {
        addLog("جاري محاكاة تشغيل اللعبة وإرسال حزم التفاعل (Presence)...");
      } else if (p === 11) {
        addLog("تم إرسال إشارات الاستمرار (Heartbeats) للديسكورد بنجاح ⚡");
      } else if (p >= quest.target) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsDone(true);
        addLog(`🎉 اكتملت المهمة 100%! تم إنجاز ${quest.name}`);
        addLog(`🎁 تم فتح المكافأة بنجاح: ${quest.reward}`);
      }
    }, 1000);
  };

  const handleStopQuest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    addLog("تم إيقاف محاكاة المهمة يدوياً.");
    setStep("quests");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start relative overflow-x-hidden text-white pb-20"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a4e 0%, #06061a 75%)",
      }}
    >
      {/* ── TOP NAV ── */}
      <nav className="w-full h-24 flex items-center justify-between px-6 md:px-14 z-20">
        <Link
          href="/"
          className="text-white/70 hover:text-white transition flex items-center gap-2 text-sm md:text-base"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          <span className="text-xl">←</span> العودة للرئيسية
        </Link>

        <div className="flex items-center gap-6" style={{ fontFamily: "'Lifta', sans-serif" }}>
          <Link href="/how-it-works" className="text-white/80 hover:text-white text-base transition">
            كيف يعمل
          </Link>
          <span className="text-white/30">·</span>
          <Link href="/faq" className="text-white/80 hover:text-white text-base transition">
            أسئلة شائعة
          </Link>
        </div>

        <Link href="/" className="w-16 h-16 relative">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
        </Link>
      </nav>

      {/* ── HEADER ── */}
      <div className="text-center px-4 mt-4 mb-8 z-10 max-w-2xl">
        <span
          className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider mb-3 border border-[#5865F2]/40 bg-[#5865F2]/10 text-[#5865F2]"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          ✨ واجهة العرض التوضيحي (Showcase)
        </span>
        <h1
          className="text-3xl md:text-5xl font-black mb-3 tracking-wide"
          style={{
            fontFamily: "'Avengeance', sans-serif",
            textShadow: "0 0 30px rgba(88, 101, 242, 0.4)",
          }}
        >
          Quester Tool
        </h1>
        <p
          className="text-sm md:text-base text-gray-300 leading-relaxed"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          لوحة تحكم استعراضية تحاكي طريقة عمل نظام إنجاز مهام الديسكورد بكل سهولة وأمان
        </p>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="w-full max-w-3xl px-4 z-10">
        <div
          className="rounded-3xl border border-white/10 p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          style={{
            background: "rgba(15, 15, 38, 0.75)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* STEP 1: TOKEN / INTRO VIEW */}
          {step === "token" && (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-[#7289da] flex items-center justify-center text-3xl mb-5 shadow-lg shadow-[#5865F2]/30">
                🔑
              </div>

              <h2
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ fontFamily: "'Lifta', sans-serif" }}
              >
                استعراض أداة المهام
              </h2>

              <p
                className="text-gray-300 text-sm md:text-base max-w-lg mb-6 leading-relaxed"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                يمكنك تجربة واجهة النظام واستعراض قائمة الكويستات والمكافآت التلقائية المتاحة
              </p>

              <div className="w-full max-w-lg mb-6 text-right">
                <label
                  className="block text-xs text-gray-400 mb-2 font-medium"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  حقل التوكن (استعراضي فقط - لا يتطلب إدخال بيانات حقيقية):
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="مثال: MTU1NzQ2MDM3NDAwMzkx..."
                    className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-[#5865F2] transition text-sm text-left font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded bg-white/5"
                  >
                    {showToken ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleStartShowcase}
                className="w-full max-w-lg py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5865F2]/40"
                style={{
                  fontFamily: "'Lifta', sans-serif",
                  background: "linear-gradient(135deg, #5865F2 0%, #3c45a5 100%)",
                }}
              >
                استعراض المهام المتاحة الآن ←
              </button>
            </div>
          )}

          {/* STEP 2: QUESTS CATALOG VIEW */}
          {step === "quests" && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ fontFamily: "'Lifta', sans-serif" }}
                  >
                    قائمة المهام النشطة
                  </h2>
                  <p
                    className="text-xs text-gray-400 mt-1"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    اختر أي مهمة لتجربة شريط التقدم ونظام الإنجاز التلقائي
                  </p>
                </div>

                <button
                  onClick={() => setStep("token")}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  ← تغيير التوكن
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_QUESTS.map((quest) => (
                  <div
                    key={quest.id}
                    className="rounded-2xl border border-white/10 p-5 bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                          style={{
                            background: `${quest.color}25`,
                            color: quest.color,
                            border: `1px solid ${quest.color}40`,
                          }}
                        >
                          {quest.badge}
                        </span>
                        <span className="text-xl">{quest.rewardIcon}</span>
                      </div>

                      <h3
                        className="font-bold text-base mb-1 text-white"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        {quest.name}
                      </h3>

                      <p className="text-xs text-gray-400 mb-3">
                        نوع المهمة: <span className="text-gray-200">{quest.type}</span>
                      </p>

                      <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 mb-4">
                        <div className="text-[11px] text-gray-400">المكافأة:</div>
                        <div className="text-xs text-[#57f287] font-semibold mt-0.5">
                          {quest.reward}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartSimulatedQuest(quest)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95 shadow-md"
                      style={{
                        fontFamily: "'Lifta', sans-serif",
                        background: `linear-gradient(135deg, ${quest.color} 0%, #20223a 100%)`,
                      }}
                    >
                      بدء إنجاز المهمة (تجربة)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: RUNNING SIMULATION VIEW */}
          {step === "running" && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedQuest.rewardIcon}</span>
                  <div>
                    <h2
                      className="text-xl md:text-2xl font-bold"
                      style={{ fontFamily: "'Lifta', sans-serif" }}
                    >
                      {selectedQuest.name}
                    </h2>
                    <span className="text-xs text-[#5865F2]">جاري المحاكاة والإنجاز التلقائي...</span>
                  </div>
                </div>

                <button
                  onClick={handleStopQuest}
                  className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold transition"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  إلغاء / إيقاف
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 p-5 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-gray-300">
                    الوقت المنقضي: {currentProgress} دقيقة / {selectedQuest.target} دقيقة
                  </span>
                  <span className="font-bold text-[#57f287] text-sm">
                    {Math.min(100, Math.round((currentProgress / selectedQuest.target) * 100))}%
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, (currentProgress / selectedQuest.target) * 100)}%`,
                      background: "linear-gradient(90deg, #5865F2, #57f287)",
                      boxShadow: "0 0 15px rgba(87, 242, 135, 0.5)",
                    }}
                  />
                </div>

                {isDone && (
                  <div className="mt-4 p-4 rounded-xl bg-[#57f287]/15 border border-[#57f287]/40 text-center animate-bounce">
                    <span className="text-lg">🎉</span>{" "}
                    <strong className="text-[#57f287] text-sm">
                      تم استكمال المهمة بنجاح! المكافأة جاهزة في حسابك.
                    </strong>
                  </div>
                )}
              </div>

              {/* Terminal Logs */}
              <div className="rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-left" dir="ltr">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-gray-500 text-[11px]">
                  <span>Console Logs (Simulation)</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto text-gray-300">
                  {logs.map((log, index) => (
                    <div key={index} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {isDone && (
                <button
                  onClick={() => setStep("quests")}
                  className="mt-6 w-full py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-sm transition shadow-lg shadow-[#5865F2]/40"
                  style={{ fontFamily: "'Lifta', sans-serif" }}
                >
                  العودة لقائمة المهام الأخرى ←
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
