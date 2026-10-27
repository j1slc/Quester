"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
}

interface ParsedQuestTask {
  id: string;
  type: "duration" | "count";
  target: number;
  current: number;
  percent: number;
  completed: boolean;
  enrolled: boolean;
}

interface ParsedReward {
  name: string;
  type?: number;
  asset?: string;
  expiresAt?: string;
}

interface ParsedQuest {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  iconUrl: string | null;
  expiresAt: string | null;
  tasks: ParsedQuestTask[];
  overallPercent: number;
  isCompleted: boolean;
  isEnrolled: boolean;
  rewards: ParsedReward[];
  applicationId: string | null;
}

export default function ToolPage() {
  const [token, setToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [quests, setQuests] = useState<ParsedQuest[]>([]);
  const [loadingQuests, setLoadingQuests] = useState<boolean>(false);
  const [selectedQuest, setSelectedQuest] = useState<ParsedQuest | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"available" | "completed" | "all">("available");

  // Runner state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [targetSeconds, setTargetSeconds] = useState<number>(900);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Load token on mount if saved
  useEffect(() => {
    const savedToken = localStorage.getItem("quester_token");
    if (savedToken) {
      setToken(savedToken);
      handleLogin(savedToken);
    }
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("ar-EG", { hour12: false });
    setLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleLogin = async (overrideToken?: string) => {
    const tokenToUse = overrideToken || token;
    if (!tokenToUse.trim()) {
      setErrorMsg("يرجى إدخال التوكن أولاً");
      return;
    }

    setErrorMsg(null);
    setLoadingAuth(true);

    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToUse.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل التحقق من التوكن");
      }

      setUser(data.user);
      localStorage.setItem("quester_token", tokenToUse.trim());
      addLog(`تم تسجيل الدخول بنجاح بحساب: ${data.user.global_name || data.user.username}`);

      // Fetch Quests
      await loadQuests(tokenToUse.trim());
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء فحص التوكن");
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadQuests = async (tokenStr: string) => {
    setLoadingQuests(true);
    try {
      const res = await fetch("/api/quests/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenStr }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuests(data.quests);
        const uncompleted = data.quests.find((q: ParsedQuest) => !q.isCompleted);
        const firstToSelect = uncompleted || data.quests[0];
        if (data.quests.length > 0 && !selectedQuest) {
          setSelectedQuest(firstToSelect);
          setCurrentProgress(firstToSelect.tasks[0]?.current || 0);
          setTargetSeconds(firstToSelect.tasks[0]?.target || 900);
          setProgressPercent(firstToSelect.overallPercent || 0);
          setIsCompleted(firstToSelect.isCompleted);
        }
        addLog(`تم العثور على ${data.quests.length} مهمة في حسابك`);
      }
    } catch (err: any) {
      addLog(`فشل جلب المهام: ${err.message}`);
    } finally {
      setLoadingQuests(false);
    }
  };

  const handleLogout = () => {
    stopRunner();
    localStorage.removeItem("quester_token");
    setUser(null);
    setQuests([]);
    setSelectedQuest(null);
    setToken("");
    setLogs([]);
    setErrorMsg(null);
  };

  const handleSelectQuest = (q: ParsedQuest) => {
    if (isRunning) return;
    setSelectedQuest(q);
    const mainTask = q.tasks[0];
    setCurrentProgress(mainTask?.current || 0);
    setTargetSeconds(mainTask?.target || 900);
    setProgressPercent(q.overallPercent || 0);
    setIsCompleted(q.isCompleted);
    addLog(`تم اختيار مهمة: ${q.title}`);
  };

  const startRunner = async () => {
    if (!selectedQuest || !token || isRunning) return;

    setIsRunning(true);
    setIsCompleted(false);
    setErrorMsg(null);
    addLog(`🚀 جاري بدء تشغيل مهمة: ${selectedQuest.title}`);

    const mainTask = selectedQuest.tasks[0] || {
      id: "PLAY_ON_DESKTOP",
      target: 900,
      current: 0,
    };

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/quests/runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          questId: selectedQuest.id,
          taskType: mainTask.id,
          target: mainTask.target,
          current: mainTask.current,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("فشل الاتصال بمحرك المهام");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;
          const matchEvent = block.match(/event:\s*([^\n]+)/);
          const matchData = block.match(/data:\s*([^\n]+)/);

          const eventType = matchEvent ? matchEvent[1].trim() : "message";
          let dataObj: any = {};
          try {
            dataObj = matchData ? JSON.parse(matchData[1].trim()) : {};
          } catch (e) {
            continue;
          }

          if (eventType === "log") {
            addLog(dataObj.message);
          } else if (eventType === "progress") {
            setCurrentProgress(dataObj.current);
            setTargetSeconds(dataObj.target);
            setProgressPercent(dataObj.percent);
            if (dataObj.completed) {
              setIsCompleted(true);
            }
          } else if (eventType === "completed") {
            setIsCompleted(true);
            setIsRunning(false);
            addLog(dataObj.message || "🎉 اكتملت المهمة بنجاح!");
            // Refresh list
            loadQuests(token.trim());
          } else if (eventType === "error") {
            setErrorMsg(dataObj.message);
            addLog(`❌ خطأ: ${dataObj.message}`);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorMsg(err.message || "حدث انقطاع في الاتصال");
        addLog(`انقطع الاتصال: ${err.message}`);
      } else {
        addLog("تم إيقاف تشغيل المهمة يدوياً.");
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const stopRunner = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    addLog("تم إيقاف العملية.");
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const availableQuests = quests.filter((q) => !q.isCompleted);
  const completedQuests = quests.filter((q) => q.isCompleted);
  const displayedQuests =
    filterTab === "available"
      ? availableQuests
      : filterTab === "completed"
      ? completedQuests
      : quests;

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
            href="/faq"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            أسئلة شائعة
          </Link>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="w-full max-w-5xl px-4 md:px-6 mt-4 flex flex-col items-center z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl md:text-5xl font-bold mb-3"
            style={{
              fontFamily: "'Lifta', sans-serif",
              textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 0 30px rgba(88,101,242,0.4)",
            }}
          >
            منصة Quester لتشغيل المهام
          </h1>
          <p
            className="text-gray-300 text-sm md:text-base max-w-xl mx-auto"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            أدخل توكن الديسكورد الخاص بك لتشغيل مهمات Discord Quests تلقائياً واستلام الجوائز والشارات فوراً!
          </p>
        </div>

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

        {/* ── STEP 1: LOGIN WITH TOKEN CARD ── */}
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
              <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-2xl">
                🔑
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
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="MTM..."
                  className="w-full px-4 py-3.5 pr-4 pl-12 rounded-2xl bg-black/40 border border-white/15 text-white placeholder-gray-500 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/40 text-sm font-mono tracking-wider transition-all"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer text-sm"
                >
                  {showToken ? "إخفاء" : "إظهار"}
                </button>
              </div>
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
                  <span>جاري التحقق وقراءة المهام...</span>
                </>
              ) : (
                <span>تسجيل الدخول وعرض المهام ←</span>
              )}
            </button>
          </div>
        ) : (
          /* ── STEP 2: DASHBOARD VIEW ── */
          <div className="w-full space-y-8" dir="rtl">
            {/* User Profile Bar */}
            <div
              className="w-full p-4 md:p-6 rounded-3xl border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl"
              style={{ background: "rgba(20, 20, 55, 0.65)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/40 border border-white/15 relative shrink-0 shadow-inner">
                  {user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#5865F2]">
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg md:text-xl text-white">
                      {user.global_name || user.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-[#7289da] border border-[#5865F2]/30 font-mono">
                      @{user.username}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">ID: {user.id}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadQuests(token)}
                  disabled={loadingQuests || isRunning}
                  className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs md:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>تحديث المهام</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs md:text-sm font-semibold transition-all cursor-pointer"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>

            {/* ── QUEST SELECTION GRID ── */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Lifta', sans-serif" }}>
                    مهام حسابك ({quests.length})
                  </h2>
                  <span className="text-xs text-gray-400">اختر المهمة لتشغيلها تلقائياً</span>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center p-1 rounded-2xl bg-black/40 border border-white/10 gap-1.5 text-xs md:text-sm">
                  <button
                    onClick={() => setFilterTab("available")}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
                      filterTab === "available"
                        ? "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/40"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>المتاحة للبدء</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                      {availableQuests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFilterTab("completed")}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
                      filterTab === "completed"
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>المكتملة</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                      {completedQuests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setFilterTab("all")}
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
                      filterTab === "all"
                        ? "bg-white/20 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>الكل</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-mono">
                      {quests.length}
                    </span>
                  </button>
                </div>
              </div>

              {loadingQuests ? (
                <div className="w-full py-16 text-center text-gray-400">
                  <div className="w-10 h-10 border-3 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <span>جاري فحص وجلب المهام من خوادم ديسكورد...</span>
                </div>
              ) : displayedQuests.length === 0 ? (
                <div className="w-full p-10 rounded-3xl border border-white/10 bg-white/5 text-center text-gray-400">
                  <div className="text-4xl mb-3">
                    {filterTab === "completed" ? "🏆" : "🎮"}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {filterTab === "completed"
                      ? "لا توجد مهام مكتملة حتى الآن"
                      : "رائع! لا توجد مهام غير مكتملة حالياً"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {filterTab === "completed"
                      ? "اختر أي مهمة من تبويب 'المتاحة للبدء' وأكملها لتظهر هنا."
                      : "جميع مهام حسابك مكتملة بنجاح، تفقد تبويب 'المكتملة' للاطلاع عليها."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedQuests.map((q) => {
                    const isSelected = selectedQuest?.id === q.id;
                    return (
                      <div
                        key={q.id}
                        onClick={() => handleSelectQuest(q)}
                        className={`relative rounded-3xl p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${
                          isSelected
                            ? "border-[#5865F2] bg-[#5865F2]/15 shadow-xl shadow-[#5865F2]/20 scale-[1.02]"
                            : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        {/* Top banner / icon */}
                        <div className="flex items-start gap-3 mb-4">
                          {q.iconUrl ? (
                            <img
                              src={q.iconUrl}
                              alt={q.title}
                              className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0 shadow-md bg-black/40"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-xl shrink-0">
                              🎯
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-base break-words">{q.title}</h3>
                            <span className="text-xs text-gray-400 block break-words mt-0.5">{q.description}</span>
                            {q.isCompleted && (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                مكتملة ✓
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar in card */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-300 mb-1 font-semibold">
                            <span>نسبة الإنجاز</span>
                            <span>{q.overallPercent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#5865F2] to-[#7289da] rounded-full transition-all duration-500"
                              style={{ width: `${q.overallPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Rewards */}
                        {q.rewards.length > 0 && (
                          <div className="pt-3 border-t border-white/10 flex items-center gap-2 justify-between text-xs">
                            <span className="text-gray-400 shrink-0">الجائزة:</span>
                            <span className="flex items-center gap-1.5 text-amber-300 font-semibold min-w-0">
                              <img
                                src="/orbicon.png"
                                alt="orb"
                                className="w-4 h-4 object-contain shrink-0"
                              />
                              <span className="break-words">{q.rewards[0].name}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── ACTIVE QUEST RUNNER CONTROLS & REAL-TIME CONSOLE ── */}
            {selectedQuest && (
              <div
                className="w-full p-6 md:p-8 rounded-3xl border border-white/15 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 50% 10%, #1e1e52 0%, #0a0a20 100%)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    {selectedQuest.iconUrl && (
                      <img
                        src={selectedQuest.iconUrl}
                        alt={selectedQuest.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-white/15 shadow-lg bg-black/40 shrink-0"
                      />
                    )}
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#7289da] font-bold block mb-1">
                        المهمة المختارة حالياً
                      </span>
                      <h3 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "'Lifta', sans-serif" }}>
                        {selectedQuest.title}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted ? (
                      <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-bold flex items-center gap-1.5 shadow-lg">
                        <span>🎉</span>
                        <span>مهمة مكتملة ومستلمة!</span>
                      </span>
                    ) : isRunning ? (
                      <span className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm font-bold flex items-center gap-2 animate-pulse shadow-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                        <span>جاري تنفيذ المهمة تلقائياً...</span>
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-full bg-white/10 text-gray-300 border border-white/15 text-sm font-semibold">
                        جاهزة للبدء
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Big Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-center text-sm mb-2 font-semibold">
                    <span className="text-gray-300">
                      التقدم: {currentProgress} ثانية من {targetSeconds} ثانية ({formatSeconds(currentProgress)} / {formatSeconds(targetSeconds)})
                    </span>
                    <span className="text-2xl font-bold text-[#5865F2] font-mono">
                      {progressPercent}%
                    </span>
                  </div>

                  <div className="w-full h-4 rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#43b581] transition-all duration-500 shadow-[0_0_15px_rgba(88,101,242,0.6)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  {!isRunning ? (
                    <button
                      onClick={startRunner}
                      disabled={isCompleted}
                      className="flex-1 py-4 px-8 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer shadow-xl shadow-[#5865F2]/40 flex items-center justify-center gap-2 text-lg"
                      style={{
                        fontFamily: "'Lifta', sans-serif",
                        background: isCompleted
                          ? "rgba(67, 181, 129, 0.4)"
                          : "linear-gradient(135deg, #5865F2 0%, #3c45a5 100%)",
                      }}
                    >
                      {isCompleted ? (
                        <>
                          <span>✓</span>
                          <span>تم إكمال هذه المهمة بالكامل</span>
                        </>
                      ) : (
                        <>
                          <span>🚀</span>
                          <span>بدء إكمال المهمة تلقائياً</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={stopRunner}
                      className="flex-1 py-4 px-8 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 text-lg"
                      style={{
                        fontFamily: "'Lifta', sans-serif",
                        background: "linear-gradient(135deg, #e53e3e 0%, #9b2c2c 100%)",
                      }}
                    >
                      <span>⏹️</span>
                      <span>إيقاف المهمة مؤقتاً</span>
                    </button>
                  )}
                </div>

                {/* Live Console / Terminal */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-2 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      سجل البث الحي (Live Terminal Logs):
                    </span>
                    <button
                      onClick={() => setLogs([])}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      مسح السجل
                    </button>
                  </div>

                  <div
                    className="w-full h-48 md:h-56 rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs overflow-y-auto space-y-1.5 shadow-inner text-gray-300"
                    dir="ltr"
                  >
                    {logs.length === 0 ? (
                      <span className="text-gray-600 select-none">
                        جاهز للتشغيل... اضغط على زر "بدء إكمال المهمة تلقائياً" لمتابعة التقدم الحي.
                      </span>
                    ) : (
                      logs.map((l, idx) => (
                        <div
                          key={idx}
                          className={`${
                            l.includes("خطأ") || l.includes("تحذير")
                              ? "text-red-400"
                              : l.includes("🎉") || l.includes("مبروك")
                              ? "text-emerald-400 font-bold"
                              : l.includes("🚀")
                              ? "text-[#7289da] font-semibold"
                              : "text-gray-300"
                          }`}
                        >
                          {l}
                        </div>
                      ))
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
