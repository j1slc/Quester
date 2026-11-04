"use client";

import { useState } from "react";
import Link from "next/link";

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      step: "01",
      title: "الحصول على التوكن (Token)",
      desc: "افتح ديسكورد عبر المتصفح (Web)، افتح أدوات المطور بالضغط على F12، وانتقل إلى تبويب Application ثم Local Storage، وانسخ رمز الـ Token الخاص بحسابك بكل أمان.",
      badge: "الخطوة الأولى",
    },
    {
      step: "02",
      title: "تسجيل الدخول في الأداة",
      desc: "ضع التوكن في الخانة المخصصة داخل صفحة الأداة واضغط على فحص والاتصال. سيتعرف النظام تلقائياً على حسابك ومهامك المتاحة دون الحاجة لكلمة سر.",
      badge: "الخطوة الثانية",
    },
    {
      step: "03",
      title: "اختيار المهمة وبدء التشغيل",
      desc: "اختر المهمة التي ترغب بإنهائها، واضغط على زر التشغيل التلقائي. سيقوم البوت بمحاكاة اللعب والبث وإرسال نبضات التقدم لسيرفرات ديسكورد تلقائياً.",
      badge: "الخطوة الثالثة",
    },
    {
      step: "04",
      title: "استلام المكافأة والجوائز",
      desc: "بمجرد وصول شريط التقدم إلى 100%، سيتم تأكيد إكمال المهمة وإضافة الجائزة (شخصيات، عناصر، ألعاب) إلى صندوق هدايا حسابك في ديسكورد فوراً.",
      badge: "الخطوة الأخيرة",
    },
  ];

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
            href="/quests"
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

      {/* ── CONTENT CONTAINER ── */}
      <div className="flex flex-col items-center text-center px-6 w-full max-w-4xl mt-10 md:mt-14 z-10">
        {/* Header Title */}
        <h1
          className="text-4xl md:text-6xl font-bold tracking-tight mb-4"
          style={{
            fontFamily: "'Lifta', sans-serif",
            textShadow: "0 0 30px rgba(88,101,242,0.4)",
          }}
        >
          كيف يعمل النظام؟
        </h1>

        <p
          className="text-base md:text-lg text-gray-300 mb-10 max-w-xl leading-relaxed"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          أربع خطوات بسيطة تفصلك عن إكمال مهام ديسكورد وحصد المكافآت دون عناء
        </p>

        {/* ── STEPS NAVIGATION CAROUSEL / SELECTOR ── */}
        <div
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer select-none ${isActive
                  ? "text-white shadow-[0_0_20px_rgba(88,101,242,0.6)] scale-[1.03]"
                  : "text-gray-300 hover:text-white hover:bg-white/5 opacity-80 hover:opacity-100"
                  }`}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #5865F2 0%, #404EED 100%)"
                    : "rgba(10, 10, 30, 0.45)",
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span className="text-sm md:text-base font-sans">{s.step}</span>
              </button>
            );
          })}
        </div>

        {/* ── ACTIVE STEP DISPLAY CARD ── */}
        <div
          className="w-full p-8 md:p-12 rounded-3xl border border-white/10 text-right relative overflow-hidden transition-all duration-500 shadow-2xl"
          style={{
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            background: "linear-gradient(135deg, rgba(88,101,242,0.08) 0%, rgba(10,10,30,0.6) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Subtle Ambient Glow inside card */}
          <div
            className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none"
            style={{ background: "#5865F2", opacity: 0.25 }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <span
              className="text-6xl md:text-8xl font-black font-mono text-[#5865F2]/30 select-none order-2 md:order-1"
            >
              {steps[activeStep].step}
            </span>

            <div className="order-1 md:order-2 flex flex-col items-start md:items-end">
              <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#5865F2]/20 text-[#7289da] font-sans border border-[#5865F2]/30 font-semibold">
                {steps[activeStep].badge}
              </span>
              <h3
                className="text-2xl md:text-3xl font-bold text-white mt-3"
                style={{ fontFamily: "'Lifta', sans-serif" }}
              >
                {steps[activeStep].title}
              </h3>
            </div>
          </div>

          <p className="text-gray-300 text-base md:text-lg leading-loose mt-4">
            {steps[activeStep].desc}
          </p>

          {/* Quick interactive navigation inside card */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeStep === 0
                ? "opacity-30 cursor-not-allowed text-gray-500"
                : "bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                }`}
            >
              → الخطوة السابقة
            </button>

            <button
              type="button"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeStep === steps.length - 1
                ? "opacity-30 cursor-not-allowed text-gray-500"
                : "bg-[#5865F2] hover:bg-[#4752c4] text-white cursor-pointer shadow-lg shadow-[#5865F2]/30"
                }`}
            >
              الخطوة التالية ←
            </button>
          </div>
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="mt-16 flex flex-col items-center">
          <Link
            href="/quests"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#4752c4] opacity-80 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md" />
            <span
              className="relative flex items-center justify-center px-20 py-4.5 rounded-full text-white font-bold transition-all duration-300 min-w-[220px]"
              style={{
                fontFamily: "'Lifta', sans-serif",
                fontSize: "19px",
                background: "linear-gradient(180deg, #5865F2 0%, #3c45a5 100%)",
                boxShadow: "0 6px 20px rgba(88, 101, 242, 0.4)",
              }}
            >
              جرب الأداة الآن
            </span>
          </Link>
        </div>
      </div>

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
