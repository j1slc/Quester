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

interface ChannelInfo {
  id: string;
  name: string;
  guild_id?: string;
  type: number;
}

export default function StreamPage() {
  const [token, setToken] = useState<string>("");
  const [showToken, setShowToken] = useState<boolean>(false);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stream Configuration
  const [channelId, setChannelId] = useState<string>("");
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [checkingChannel, setCheckingChannel] = useState<boolean>(false);
  const [targetHours, setTargetHours] = useState<number>(75);
  const [customHours, setCustomHours] = useState<string>("75");

  // Runner state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Load saved token from localStorage
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

      if (!res.ok || !data.user) {
        setErrorMsg(data.error || "التوكن غير صالح أو حدث خطأ أثناء التحقق");
        setUser(null);
      } else {
        setUser(data.user);
        localStorage.setItem("quester_token", tokenToUse.trim());
        addLog(`تم تسجيل الدخول كـ: ${data.user.global_name || data.user.username}`);
      }
    } catch (err: any) {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً");
    } finally {
      setLoadingAuth(false);
    }
  };

  // Verify Channel ID
  const verifyChannel = async (id: string) => {
    if (!id.trim() || !token.trim()) return;
    setCheckingChannel(true);
    setChannelInfo(null);

    try {
      const res = await fetch("/api/stream/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), channelId: id.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.id) {
        setChannelInfo(data);
        addLog(`تم العثور على الروم الصوتي: #${data.name}`);
      } else {
        setChannelInfo(null);
        setErrorMsg(data.error || "لم يتم العثور على الروم الصوتي");
      }
    } catch (e) {
      setChannelInfo(null);
    } finally {
      setCheckingChannel(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartStream = async () => {
    if (!token.trim()) {
      setErrorMsg("يرجى إدخال التوكن أولاً");
      return;
    }
    if (!channelId.trim()) {
      setErrorMsg("يرجى إدخال أيدي الروم الصوتي (Voice Channel ID)");
      return;
    }

    setErrorMsg(null);
    setIsRunning(true);
    setStreamActive(false);
    setIsCompleted(false);
    setElapsedSeconds(0);
    setProgressPercent(0);
    setLogs([]);

    const hours = Number(customHours) || targetHours || 75;
    addLog(`بدء جلسة الستريم التلقائي | الهدف: ${hours} ساعة`);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/stream/runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          channelId: channelId.trim(),
          targetHours: hours,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "فشل الاتصال بالخادم");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("تعذر قراءة تيار البيانات (SSE)");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;
          let eventType = "message";
          let dataStr = "";

          const linesInBlock = block.split("\n");
          for (const line of linesInBlock) {
            if (line.startsWith("event: ")) {
              eventType = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.replace("data: ", "").trim();
            }
          }

          if (dataStr) {
            try {
              const parsed = JSON.parse(dataStr);
              if (eventType === "log") {
                addLog(parsed.message);
              } else if (eventType === "status") {
                if (parsed.state === "streaming") {
                  setStreamActive(true);
                } else {
                  setStreamActive(false);
                }
              } else if (eventType === "progress") {
                setElapsedSeconds(parsed.current);
                setRemainingSeconds(parsed.remaining || 0);
                setProgressPercent(parsed.percent);
                if (parsed.completed) {
                  setIsCompleted(true);
                  setIsRunning(false);
                  setStreamActive(false);
                }
              }
            } catch (e) { }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        addLog("تم إيقاف الستريم من قبل المستخدم.");
      } else {
        addLog(`خطأ: ${err.message}`);
        setErrorMsg(err.message);
      }
    } finally {
      setIsRunning(false);
      setStreamActive(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog("جاري إنهاء الستريم ومغادرة الروم الصوتي...");
    }
  };

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
            href="/tool"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            الكويستات
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

      {/* ── MAIN CONTENT ── */}
      <div className="w-full max-w-5xl px-4 md:px-6 mt-4 flex flex-col items-center z-10 gap-8">
        {/* HERO HEADER */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#23a55a]/15 border border-[#23a55a]/40 text-[#23a55a] text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#23a55a]"></span>
            <span>Go Live Screen Share • الشاشة الخضراء النشطة</span>
          </div>

          <h1
            className="text-3xl md:text-5xl font-bold tracking-wide"
            style={{ fontFamily: "'Lifta', sans-serif" }}
          >
            بوت ستريم شارة ديسكورد (Streaming Badge)
          </h1>

          <p className="text-white/70 max-w-2xl text-sm md:text-base leading-relaxed">
            يدخل الروم الصوتي تلقائياً ويفتح بث الشاشة{" "}
            <span className="text-[#23a55a] font-bold">Go Live (الشاشة الخضراء 🖥️)</span> لتجميع ساعات شارة الستريم في ديسكورد مباشرة من متصفحك وبدون الحاجة لفتح أي لعبة!
          </p>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-300 hover:text-white text-xs cursor-pointer"
            >
              إغلاق ✕
            </button>
          </div>
        )}

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: CONFIGURATION */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. DISCORD TOKEN SECTION */}
            <div className="p-6 rounded-3xl bg-[#0e0e28]/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center">
                    <img src="/hashtag.png" alt="token" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">توكن حساب ديسكورد</h3>
                    <p className="text-white/50 text-xs">مطلوب لدخول الروم الصوتي وتفعيل الستريم</p>
                  </div>
                </div>

                {user && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>متصل: {user.global_name || user.username}</span>
                  </div>
                )}
              </div>

              {/* INPUT WITH TOGGLE */}
              <div className="flex items-center gap-3">
                <input
                  type={showToken ? "text" : "password"}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="أدخل توكن حسابك هنا..."
                  className="flex-1 bg-black/40 border border-white/15 focus:border-[#5865F2] rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="cursor-pointer transition-opacity hover:opacity-80 shrink-0"
                  title={showToken ? "إخفاء التوكن" : "إظهار التوكن"}
                >
                  <img
                    src={showToken ? "/switch_enabled.png" : "/switch_disabled.png"}
                    alt={showToken ? "Enabled" : "Disabled"}
                    className="w-12 h-7 object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleLogin()}
                  disabled={loadingAuth || !token.trim()}
                  className="px-5 py-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  {loadingAuth ? "تحقق..." : "تأكيد"}
                </button>
              </div>

              {/* USER PROFILE SNIPPET */}
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="relative">
                    <img
                      src={
                        user.avatar
                          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                          : "https://cdn.discordapp.com/embed/avatars/0.png"
                      }
                      alt="avatar"
                      className="w-10 h-10 rounded-full border border-white/20"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#23a55a] border-2 border-[#06061a]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-white">{user.global_name || user.username}</span>
                    <span className="text-xs text-white/50">ID: {user.id}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. VOICE CHANNEL SECTION */}
            <div className="p-6 rounded-3xl bg-[#0e0e28]/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                  <img src="/volume.png" alt="voice" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">الروم الصوتي (Voice Channel ID)</h3>
                  <p className="text-white/50 text-xs">أيدي الكانال اللي هيفتح فيه شير الشاشة</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => {
                    setChannelId(e.target.value);
                    if (e.target.value.length >= 17) {
                      verifyChannel(e.target.value);
                    }
                  }}
                  onBlur={() => verifyChannel(channelId)}
                  placeholder="مثال: 153xxxxxxxxxxxxxxxx"
                  className="flex-1 bg-black/40 border border-white/15 focus:border-purple-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => verifyChannel(channelId)}
                  disabled={checkingChannel || !channelId.trim()}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  {checkingChannel ? "فحص..." : "فحص الروم"}
                </button>
              </div>

              {channelInfo && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <span>✅</span>
                  <span>تم تأكيد الروم الصوتي: <strong>#{channelInfo.name}</strong></span>
                </div>
              )}

              <p className="text-white/40 text-[11px] leading-relaxed">
                💡 <strong>كيف تجيب الـ ID؟</strong> افتح ديسكورد، اضغط كليك يمين على أي روم صوتي في سيرفرك واضغط <strong>Copy Channel ID</strong>. (تأكد إن Developer Mode مفعل في إعدادات ديسكورد).
              </p>
            </div>

            {/* 3. TARGET HOURS SELECTOR */}
            <div className="p-6 rounded-3xl bg-[#0e0e28]/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <img src="/expire.png" alt="hours" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">مدة الستريم المستهدفة (ساعات)</h3>
                    <p className="text-white/50 text-xs">المدة اللي البوت هيفضل فاتح فيها الستريم</p>
                  </div>
                </div>

                <span className="font-bold text-lg text-amber-400">
                  {customHours} ساعة
                </span>
              </div>

              {/* PRESET CHIPS */}
              <div className="grid grid-cols-5 gap-2">
                {[10, 25, 50, 75, 100].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setTargetHours(h);
                      setCustomHours(h.toString());
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${Number(customHours) === h
                        ? "bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>

              {/* CUSTOM INPUT */}
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">أو اكتب عدد ساعات مخصص:</span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-24 bg-black/40 border border-white/15 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-center text-white outline-none"
                />
              </div>
            </div>

            {/* ACTION BUTTON */}
            {!isRunning ? (
              <button
                type="button"
                onClick={handleStartStream}
                disabled={!token.trim() || !channelId.trim()}
                className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-[#23a55a] via-[#2bbd69] to-[#1f8b4d] hover:brightness-110 disabled:opacity-50 text-white text-base font-bold shadow-xl shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-3 overflow-hidden"
              >
                <span className="text-xl">🚀</span>
                <span>بدء الستريم التلقائي (Go Live 🖥️)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopStream}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:brightness-110 text-white text-base font-bold shadow-xl shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                <span className="text-xl">🛑</span>
                <span>إيقاف الستريم والخروج من الروم الصوتي</span>
              </button>
            )}
          </div>

          {/* RIGHT COLUMN: LIVE MONITOR & TERMINAL */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* LIVE STREAM STATUS CARD */}
            <div className="p-6 rounded-3xl bg-[#0e0e28]/70 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>📊</span>
                  <span>حالة الستريم المباشر</span>
                </h3>

                {streamActive ? (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#23a55a]/20 border border-[#23a55a]/40 text-[#23a55a] text-xs font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#23a55a] animate-ping"></span>
                    <span>LIVE نشط 🖥️</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs">
                    <span className="w-2 h-2 rounded-full bg-white/30"></span>
                    <span>متوقف</span>
                  </div>
                )}
              </div>

              {/* VISUAL MONITOR DISPLAY */}
              <div className="relative p-6 rounded-2xl bg-black/50 border border-white/10 flex flex-col items-center justify-center text-center gap-3 overflow-hidden">
                {/* Glowing aura */}
                {streamActive && (
                  <div className="absolute inset-0 bg-[#23a55a]/10 blur-xl animate-pulse" />
                )}

                <div className="relative">
                  <div
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl transition-all duration-300 ${streamActive
                        ? "bg-[#23a55a]/20 border-2 border-[#23a55a] shadow-[0_0_30px_rgba(35,165,90,0.5)] scale-105"
                        : "bg-white/5 border border-white/10"
                      }`}
                  >
                    <img
                      src="/STREAM_ON_DESKTOP.png"
                      alt="Stream"
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  {streamActive && (
                    <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-[#23a55a] text-black font-extrabold text-[10px] uppercase tracking-wider">
                      Live
                    </span>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-white text-base">
                    {streamActive ? "شاشة Go Live الخضراء نشطة" : "في انتظار بدء الستريم"}
                  </span>
                  <span className="text-white/50 text-xs">
                    {streamActive
                      ? "جاري احتساب ساعات شارة الستريم في ديسكورد"
                      : "اضغط بدء الستريم لدخول الروم والبدء فوراً"}
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">نسبة التقدم:</span>
                  <span className="font-bold text-[#23a55a]">{progressPercent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-black/60 overflow-hidden border border-white/10 p-[2px]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#23a55a] to-[#4ade80] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* STATS COUNTERS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
                  <span className="text-[11px] text-white/50">الوقت المنقضي:</span>
                  <span className="font-mono font-bold text-sm text-white">
                    {formatDuration(elapsedSeconds)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
                  <span className="text-[11px] text-white/50">الوقت المتبقي:</span>
                  <span className="font-mono font-bold text-sm text-amber-400">
                    {formatDuration(remainingSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE TERMINAL LOGS */}
            <div className="p-5 rounded-3xl bg-[#09091b] border border-white/10 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00c988] animate-pulse"></span>
                  <span className="font-mono text-xs md:text-sm text-white/90">
                    سجل البث الحي (Live Terminal Logs):
                  </span>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="text-white/40 hover:text-white text-[11px] transition-colors cursor-pointer"
                >
                  مسح السجل
                </button>
              </div>

              <div className="h-64 overflow-y-auto font-mono text-xs text-white/80 flex flex-col gap-1.5 p-2 bg-black/40 rounded-xl border border-white/5">
                {logs.length === 0 ? (
                  <span className="text-white/30 text-center my-auto">
                    سجل الأحداث المباشر سيظهر هنا بمجرد بدء الستريم...
                  </span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="leading-relaxed break-all">
                      {log}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
