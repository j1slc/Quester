"use client";

import { useState, useEffect } from "react";

export default function AntiInspect() {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  useEffect(() => {
    // 1. عند محاولة كليك يمين
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. كشف اختصارات وأزرار المطورين (F12, Ctrl+Shift+I, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isF12 = e.key === "F12" || e.keyCode === 123;
      const isInspect =
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key);
      const isViewSource = e.ctrlKey && ["U", "u"].includes(e.key);

      if (isF12 || isInspect || isViewSource) {
        e.preventDefault();
        setIsBlocked(true);
        return false;
      }

      // منع حفظ الصفحة Ctrl+S
      if (e.ctrlKey && ["S", "s"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    // 3. كشف فتح أدوات المطورين عبر مراقبة أبعاد النافذة (DevTools Docked)
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        setIsBlocked(true);
      }
    };

    // 4. تقنية كشف Debugger لو الكونسول مفتوح
    const debuggerCheck = setInterval(() => {
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        setIsBlocked(true);
      }
    }, 1000);

    window.addEventListener("resize", checkDevTools);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // فحص فوري عند التحميل
    checkDevTools();

    return () => {
      clearInterval(debuggerCheck);
      window.removeEventListener("resize", checkDevTools);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // قفل السكرول عند الحظر
  useEffect(() => {
    if (isBlocked) {
      document.body.style.overflow = "hidden";
    }
  }, [isBlocked]);

  if (!isBlocked) return null;

  return (
    <div
      className="fixed inset-0 z-[999999] bg-[#070714] flex flex-col items-center justify-center text-center px-6 select-none animate-fade-in"
      dir="rtl"
      style={{
        fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
      }}
    >
      {/* مثلث التحذير */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-bounce">
          ⚠️
        </div>
      </div>

      {/* عنوان التحذير الرئيسي */}
      <h1
        className="text-3xl md:text-5xl font-black text-[#ff3344] mb-4 tracking-wide"
        style={{
          textShadow: "0 0 30px rgba(255,51,68,0.5), 0 4px 10px rgba(0,0,0,0.8)",
        }}
      >
        تحذير: ممنوع العبث
      </h1>

      {/* الرسالة النصية */}
      <div className="max-w-md flex flex-col gap-2 text-white/80">
        <p className="text-base md:text-lg font-medium leading-relaxed">
          رصدنا محاولة عبث بالموقع، وتم إبلاغ المبرمجين والإدارة فيها.
        </p>
        <p className="text-sm md:text-base text-white/60 leading-relaxed">
          لو تكررت راح يتم حظرك نهائياً من السيرفر والموقع.
        </p>
      </div>

      {/* خط جمالي أحمر */}
      <div className="w-32 h-1 rounded-full bg-gradient-to-r from-transparent via-[#ff3344] to-transparent mt-8 opacity-70" />
    </div>
  );
}
