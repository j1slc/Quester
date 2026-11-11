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
  const [rememberMe, setRememberMe] = useState<boolean>(true);
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
  const isRunningRef = useRef<boolean>(false);
  const pendingAutoStartRef = useRef<ParsedQuest | null>(null);
  const questsRef = useRef<ParsedQuest[]>([]);
  const completedQuestIdsRef = useRef<Set<string>>(new Set());

  // Automatic countdown before next quest
  const [waitingCountdown, setWaitingCountdown] = useState<number | null>(null);
  const [nextQueuedQuest, setNextQueuedQuest] = useState<ParsedQuest | null>(null);
  const waitingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set page title
  useEffect(() => {
    document.title = "Quester — المهام";
  }, []);

  // Lightweight synthesized audio chime for quest completion (0 bytes download, ultra light)
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Play a quick cheerful 3-note chime (C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.36);
      });
    } catch {
      // Audio not permitted without interaction or unsupported
    }
  };

  // Clear countdown timer on unmount
  useEffect(() => {
    return () => {
      if (waitingTimerRef.current) clearInterval(waitingTimerRef.current);
    };
  }, []);

  const startNextQuestCountdown = (nextQuest: ParsedQuest, durationSec: number = 60) => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setNextQueuedQuest(nextQuest);
    setSelectedQuest(nextQuest);
    const mainTask = nextQuest.tasks[0];
    setCurrentProgress(mainTask?.current || 0);
    setTargetSeconds(mainTask?.target || 900);
    setProgressPercent(nextQuest.overallPercent || 0);
    setIsCompleted(false);
    setWaitingCountdown(durationSec);
    addLog(`⏳ يرجى الانتظار قليلاً ... سيتم تشغيل المهمة التالية تلقائياً بعد ${durationSec} ثانية: ${nextQuest.title}`);

    let remaining = durationSec;
    waitingTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (waitingTimerRef.current) clearInterval(waitingTimerRef.current);
        waitingTimerRef.current = null;
        setWaitingCountdown(null);
        setNextQueuedQuest(null);
        addLog(`⚡ انتهت مدة الانتظار! جاري بدء تشغيل المهمة: ${nextQuest.title}`);
        startRunner(nextQuest);
      } else {
        setWaitingCountdown(remaining);
        if (remaining === 45 || remaining === 30 || remaining === 15 || remaining === 5) {
          addLog(`⏳ يرجى الانتظار قليلاً ... متبقي ${remaining} ثانية على بدء المهمة التالية: ${nextQuest.title}`);
        }
      }
    }, 1000);
  };

  const skipWaitingAndStart = () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    const q = nextQueuedQuest;
    setWaitingCountdown(null);
    setNextQueuedQuest(null);
    if (q) {
      addLog(`⚡ تم تخطي فترة الانتظار! بدء المهمة الآن: ${q.title}`);
      startRunner(q);
    }
  };

  const cancelWaiting = () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setWaitingCountdown(null);
    setNextQueuedQuest(null);
    addLog("تم إلغاء الانتظار والتشغيل التلقائي.");
  };

  // Auto scroll logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Real-time second-by-second ticker while running
  useEffect(() => {
    if (!isRunning || isCompleted) return;

    const timer = setInterval(() => {
      setCurrentProgress((prev) => {
        if (targetSeconds <= 0) return prev;
        const next = Math.min(targetSeconds, prev + 1);
        const nextPercent = Math.min(100, Math.floor((next / targetSeconds) * 100));
        setProgressPercent(nextPercent);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isCompleted, targetSeconds]);

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
      if (rememberMe) {
        localStorage.setItem("quester_token", tokenToUse.trim());
      } else {
        localStorage.removeItem("quester_token");
      }
      addLog(`تم تسجيل الدخول بنجاح بحساب: ${data.user.global_name || data.user.username}`);

      // Fetch Quests
      await loadQuests(tokenToUse.trim(), { autoStart: true });
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء فحص التوكن");
      setUser(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadQuests = async (tokenStr: string, opts?: { autoStart?: boolean }) => {
    setLoadingQuests(true);
    try {
      const res = await fetch("/api/quests/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenStr }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Merge with locally completed quest IDs to avoid stale Discord API latency
        const completedIds = completedQuestIdsRef.current;
        const mergedQuests: ParsedQuest[] = data.quests.map((q: ParsedQuest) => {
          if (completedIds.has(q.id)) {
            return { ...q, isCompleted: true, overallPercent: 100 };
          }
          return q;
        });

        questsRef.current = mergedQuests;
        setQuests(mergedQuests);

        // Only switch selected quest if not running and not currently in countdown
        if (!isRunningRef.current && waitingTimerRef.current === null) {
          const uncompleted = mergedQuests.find((q: ParsedQuest) => !q.isCompleted);
          const firstToSelect = uncompleted || mergedQuests[0];
          if (selectedQuest) {
            const updated = mergedQuests.find((q: ParsedQuest) => q.id === selectedQuest.id);
            if (updated) {
              setSelectedQuest(updated);
              const mainTask = updated.tasks[0];
              setCurrentProgress(mainTask?.current || 0);
              setTargetSeconds(mainTask?.target || 900);
              setProgressPercent(updated.overallPercent || 0);
              setIsCompleted(updated.isCompleted);
            }
          } else if (mergedQuests.length > 0) {
            setSelectedQuest(firstToSelect);
            setCurrentProgress(firstToSelect.tasks[0]?.current || 0);
            setTargetSeconds(firstToSelect.tasks[0]?.target || 900);
            setProgressPercent(firstToSelect.overallPercent || 0);
            setIsCompleted(firstToSelect.isCompleted);
          }
        }
        addLog(`تم العثور على ${data.quests.length} مهمة في حسابك`);

        // Auto start the first uncompleted quest if requested (e.g. right after login)
        const uncompleted = mergedQuests.find((q: ParsedQuest) => !q.isCompleted);
        const firstToSelect = uncompleted || mergedQuests[0];
        if (opts?.autoStart && mergedQuests.length > 0 && !isRunningRef.current && firstToSelect && !firstToSelect.isCompleted) {
          startRunner(firstToSelect);
        }
      }
    } catch (err: any) {
      addLog(`فشل جلب المهام: ${err.message}`);
    } finally {
      setLoadingQuests(false);
    }
  };

  const handleLogout = () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setWaitingCountdown(null);
    setNextQueuedQuest(null);
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

    // If waiting countdown is running and user picks an uncompleted quest, update queue
    if (waitingTimerRef.current !== null && !q.isCompleted) {
      setNextQueuedQuest(q);
      addLog(`⏳ تم تعيين المهمة التالية في طابور الانتظار: ${q.title}`);
    }
  };

  const startRunner = async (questOverride?: ParsedQuest | null) => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setWaitingCountdown(null);
    setNextQueuedQuest(null);
    const quest = questOverride || selectedQuest;
    if (!quest || !token || isRunningRef.current) return;

    isRunningRef.current = true;
    setIsRunning(true);
    setSelectedQuest(quest);
    setIsCompleted(false);
    setErrorMsg(null);
    addLog(`🚀 جاري بدء تشغيل مهمة: ${quest.title}`);

    const mainTask = quest.tasks[0] || {
      id: "PLAY_ON_DESKTOP",
      target: 900,
      current: 0,
    };

    const initialPercent = mainTask.target > 0
      ? Math.min(100, Math.floor(((mainTask.current || 0) / mainTask.target) * 100))
      : (quest.overallPercent || 0);
    setCurrentProgress(mainTask.current || 0);
    setTargetSeconds(mainTask.target || 900);
    setProgressPercent(initialPercent);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/quests/runner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          questId: quest.id,
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
              completedQuestIdsRef.current.add(quest.id);
            }
          } else if (eventType === "completed") {
            setIsCompleted(true);
            completedQuestIdsRef.current.add(quest.id);
            playSuccessChime();
            addLog(dataObj.message || "🎉 اكتملت المهمة بنجاح!");

            // Mark this quest as completed in local state immediately so it's never selected again
            questsRef.current = questsRef.current.map((q) =>
              q.id === quest.id ? { ...q, isCompleted: true, overallPercent: 100 } : q
            );
            setQuests([...questsRef.current]);

            // Auto queue the next quest when one is available
            const nextQuest = questsRef.current.find(
              (q) => !completedQuestIdsRef.current.has(q.id) && !q.isCompleted && q.id !== quest.id
            );
            if (nextQuest) {
              pendingAutoStartRef.current = nextQuest;
            }

            // Refresh list in background
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
      isRunningRef.current = false;
      setIsRunning(false);
      abortControllerRef.current = null;

      // Auto start the next quest after 60 seconds countdown
      const nextToRun =
        pendingAutoStartRef.current ||
        questsRef.current.find(
          (q) => !completedQuestIdsRef.current.has(q.id) && !q.isCompleted && q.id !== quest.id
        );
      pendingAutoStartRef.current = null;

      if (nextToRun) {
        startNextQuestCountdown(nextToRun, 60);
      } else {
        const hasAnyUnfinished = questsRef.current.some(
          (q) => !completedQuestIdsRef.current.has(q.id) && !q.isCompleted
        );
        if (!hasAnyUnfinished) {
          addLog("🎉 تهانينا! اكتملت جميع المهام بنجاح ولا توجد مهام أخرى.");
        }
      }
    }
  };

  const stopRunner = () => {
    if (waitingTimerRef.current) {
      clearInterval(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
    setWaitingCountdown(null);
    setNextQueuedQuest(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isRunningRef.current = false;
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
            href="/badges"
            className="text-white/85 hover:text-white transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            الشارات
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
            أدخل توكن الديسكورد الخاص بك لتشغيل مهمات Discord Quests تلقائياً واستلام الجوائز فوراً!
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
                  <img
                    src="/refresh.png"
                    alt="refresh"
                    className={`w-4 h-4 object-contain shrink-0 ${loadingQuests ? "animate-spin" : ""}`}
                    style={{ filter: "brightness(0) saturate(100%) invert(38%) sepia(74%) saturate(4425%) hue-rotate(222deg) brightness(98%) contrast(91%)" }}
                  />
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
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${filterTab === "available"
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
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${filterTab === "completed"
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
                    className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${filterTab === "all"
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
                        className={`relative rounded-3xl p-5 border transition-all duration-300 cursor-pointer overflow-hidden ${isSelected
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
                    {waitingCountdown !== null && waitingCountdown > 0 ? (
                      <span className="px-4 py-2 rounded-full bg-[#5865F2]/20 text-[#7289da] border border-[#5865F2]/40 text-sm font-bold flex items-center gap-2 animate-pulse shadow-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#5865F2] animate-ping" />
                        <span>يرجى الانتظار قليلاً ({waitingCountdown}s)...</span>
                      </span>
                    ) : isCompleted ? (
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

                {/* ── WAITING / COOLDOWN BANNER BEFORE NEXT QUEST ── */}
                {waitingCountdown !== null && waitingCountdown > 0 && nextQueuedQuest && (
                  <div className="w-full p-5 mb-8 rounded-2xl bg-gradient-to-r from-[#5865F2]/20 via-[#404EED]/15 to-[#5865F2]/20 border border-[#5865F2]/40 text-center relative overflow-hidden backdrop-blur-xl shadow-[0_0_25px_rgba(88,101,242,0.25)]">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                      <span className="text-xl">⏳</span>
                      <h4
                        className="text-xl md:text-2xl font-bold text-white tracking-wide"
                        style={{ fontFamily: "'Lifta', sans-serif" }}
                      >
                        يرجى الانتظار قليلاً ...
                      </h4>
                    </div>

                    <p
                      className="text-xs md:text-sm text-gray-300 mb-4 max-w-lg mx-auto leading-relaxed"
                      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                    >
                      اكتملت المهمة السابقة بنجاح! جاري تحضير وبدء المهمة التالية تلقائياً:{" "}
                      <strong className="text-white font-bold">{nextQueuedQuest.title}</strong>
                    </p>

                    <div className="flex items-center justify-center gap-4">
                      <div className="px-5 py-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-2xl font-bold text-[#7289da] shadow-inner">
                        00:{waitingCountdown < 10 ? `0${waitingCountdown}` : waitingCountdown}
                      </div>

                      <button
                        type="button"
                        onClick={skipWaitingAndStart}
                        className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs md:text-sm font-bold transition-all shadow-lg shadow-[#5865F2]/30 cursor-pointer hover:scale-105 active:scale-95"
                        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                      >
                        بدء الآن دون انتظار ⚡
                      </button>
                    </div>
                  </div>
                )}

                {/* Control Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  {waitingCountdown !== null && waitingCountdown > 0 ? (
                    <div className="flex-1 flex flex-wrap gap-3">
                      <button
                        onClick={skipWaitingAndStart}
                        className="flex-1 py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-[#5865F2]/40 flex items-center justify-center gap-2 text-base md:text-lg"
                        style={{
                          fontFamily: "'Lifta', sans-serif",
                          background: "linear-gradient(135deg, #5865F2 0%, #3c45a5 100%)",
                        }}
                      >
                        <span>⚡ بدء المهمة التالية فوراً دون انتظار (00:{waitingCountdown < 10 ? `0${waitingCountdown}` : waitingCountdown})</span>
                      </button>
                      <button
                        onClick={cancelWaiting}
                        className="py-4 px-6 rounded-2xl font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all cursor-pointer text-sm md:text-base hover:scale-[1.02] active:scale-[0.98]"
                        style={{ fontFamily: "'Lifta', sans-serif" }}
                      >
                        <span>إلغاء الانتظار ⏹️</span>
                      </button>
                    </div>
                  ) : !isRunning ? (
                    <button
                      onClick={() => startRunner()}
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
                          className={`${l.includes("خطأ") || l.includes("تحذير")
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

        {/* ── FOOTER ── */}
        <footer
          className="mt-20 mb-6 flex flex-col items-center justify-center gap-2 select-none z-10"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
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
      </div>
    </main>
  );
}
