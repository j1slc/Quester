"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1a1a4e 0%, #06061a 70%)" }}
    >
      {/* ── TOP NAV ── */}
      <nav className="absolute top-0 left-0 right-0 h-28 flex items-center justify-center px-6 md:px-12 z-20">
        {/* الروابط في المنتصف تماماً — كما كانت في الأصل */}
        <div
          className="flex items-center gap-6"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          {/* كيف يعمل */}
          <Link
            href="/how-it-works"
            className="text-white/85 hover:text-white text-lg transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            كيف يعمل
          </Link>

          {/* separator */}
          <span className="text-white/30 select-none tracking-widest">─ · ─</span>

          {/* أسئلة شائعة */}
          <Link
            href="/faq"
            className="text-white/85 hover:text-white text-lg transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            أسئلة شائعة
          </Link>
        </div>

        {/* زر سيرفر الديسكورد في أقصى اليسار */}
        <a
          href="https://discord.gg/Yeb9bRX7Qf"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2]/40 border border-[#5865F2]/50 text-white text-xs sm:text-sm font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105 shadow-md shadow-[#5865F2]/20 select-none"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          <svg className="w-4 h-4 fill-current text-[#7289da]" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span className="hidden sm:inline">سيرفر الدعم</span>
        </a>
      </nav>

      {/* ── HERO CONTENT ── */}
      <div className="flex flex-col items-center text-center px-6 w-full max-w-4xl z-10">
        {/* QUESTER */}
        <h1
          className="leading-none select-none"
          style={{
            fontFamily: "'Avengeance', sans-serif",
            fontSize: "clamp(72px,13vw,140px)",
            color: "#ffffff",
            letterSpacing: "2px",
            textShadow: "4px 6px 14px rgba(0,0,0,0.9), 0 0 40px rgba(20,20,80,0.5)",
          }}
        >
          Quester
        </h1>

        {/* Description */}
        <p
          className="mt-5 text-[15px] leading-loose"
          style={{
            fontFamily: "'IBM Plex Sans Arabic', var(--font-ibm), sans-serif",
            color: "#dddddd",
            maxWidth: "460px",
            textShadow: "2px 4px 8px rgba(0,0,0,0.85)",
          }}
        >
          هذا البوت يستخدم في عمل مهام{" "}
          <span style={{ color: "#5865f2", fontWeight: 700 }}>الديسكورد</span>
          {" "}تلقائياً و بسهولة
          <br />
          هذا البوت مجاني <strong>%100</strong>
        </p>

        {/* Divider */}
        <div
          className="mt-7 mb-7 w-full max-w-xl"
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
          }}
        />

        {/* Promo text */}
        <p
          className="font-bold"
          style={{
            fontFamily: "'Lifta', sans-serif",
            fontSize: "clamp(20px,3vw,28px)",
            color: "#ffffff",
            textShadow: "3px 5px 10px rgba(0,0,0,0.85)",
          }}
        >
          ابدأ الآن، ماذا تنتظر؟
        </p>

        {/* CTA Button — Opens Pop-up Modal */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group relative mt-7 inline-flex items-center justify-center overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer select-none"
        >
          {/* Glowing animated border/backdrop */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#4752c4] opacity-80 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md" />

          {/* Button core */}
          <span
            className="relative flex items-center justify-center px-24 py-5 md:px-28 md:py-6 rounded-full text-white font-bold transition-all duration-300 min-w-[260px] md:min-w-[320px]"
            style={{
              fontFamily: "'Lifta', sans-serif",
              fontSize: "clamp(20px,2.2vw,26px)",
              background: "linear-gradient(180deg, #5865F2 0%, #3c45a5 100%)",
              boxShadow: "0 8px 25px rgba(88, 101, 242, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              letterSpacing: "0.5px",
            }}
          >
            اضغط هُنا
          </span>
        </button>
      </div>

      {/* ── MODAL POPUP ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl p-5 sm:p-7 rounded-3xl bg-[#0c0d26]/95 border border-white/15 shadow-[0_0_50px_rgba(88,101,242,0.35)] backdrop-blur-2xl text-center"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all select-none text-base cursor-pointer z-10"
              aria-label="إغلاق"
            >
              ✕
            </button>

            {/* Modal Title */}
            <h2
              className="text-xl sm:text-2xl font-bold text-white mb-1.5"
              style={{
                fontFamily: "'Lifta', sans-serif",
                textShadow: "0 2px 10px rgba(0,0,0,0.6)",
              }}
            >
              اختر وجهتك
            </h2>
            <p
              className="text-gray-300 text-xs sm:text-sm mb-5 max-w-xs mx-auto leading-relaxed"
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              حدد الخدمة التي ترغب بالبدء بها بكل سهولة وأمان:
            </p>

            {/* 2 Compact Cards: One on Right, One on Left */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Quests (المهام) */}
              <Link
                href="/quests"
                className="group relative p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-[#5865F2] transition-all duration-300 flex flex-col items-center text-center hover:scale-[1.03] active:scale-95 hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] cursor-pointer select-none overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(88, 101, 242, 0.16) 0%, rgba(10, 11, 30, 0.85) 100%)",
                }}
              >
                {/* Glowing halo behind icon */}
                <div className="relative mb-3 mt-1">
                  <div className="absolute inset-0 rounded-full bg-[#5865F2]/40 blur-lg group-hover:scale-125 transition-transform duration-300" />
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center p-2.5 relative z-10 group-hover:scale-110 transition-transform shadow-inner">
                    <img
                      src="/badges/quest.png"
                      alt="مهام ديسكورد"
                      className="w-full h-full object-contain drop-shadow"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="text-base sm:text-lg font-bold text-white mb-0.5 group-hover:text-[#8ea1e1] transition-colors"
                  style={{ fontFamily: "'Lifta', sans-serif" }}
                >
                  مهام الديسكورد
                </h3>
                <span className="text-[11px] text-[#8ea1e1] font-mono mb-2" dir="ltr">
                  Discord Quests
                </span>

                {/* Description */}
                <p
                  className="text-[11px] sm:text-xs text-gray-300 leading-relaxed mb-4"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  تشغيل وإكمال مهمات الديسكورد تلقائياً وبسرعة فائقة واستلام الجوائز والهدايا فوراً.
                </p>

                {/* CTA Pill */}
                <div
                  className="mt-auto px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 group-hover:shadow-[0_0_15px_rgba(88,101,242,0.6)] transition-all"
                  style={{
                    fontFamily: "'Lifta', sans-serif",
                    background: "linear-gradient(180deg, #5865F2 0%, #3c45a5 100%)",
                  }}
                >
                  <span>بدء المهام</span>
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </div>
              </Link>

              {/* Card 2: Badges (الشارات) */}
              <Link
                href="/badges"
                className="group relative p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-[#9c84ef] transition-all duration-300 flex flex-col items-center text-center hover:scale-[1.03] active:scale-95 hover:shadow-[0_0_30px_rgba(156,132,239,0.4)] cursor-pointer select-none overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, rgba(156, 132, 239, 0.16) 0%, rgba(18, 12, 38, 0.85) 100%)",
                }}
              >
                {/* Glowing halo behind icon */}
                <div className="relative mb-3 mt-1">
                  <div className="absolute inset-0 rounded-full bg-[#9c84ef]/40 blur-lg group-hover:scale-125 transition-transform duration-300" />
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#9c84ef]/20 border border-[#9c84ef]/40 flex items-center justify-center p-2.5 relative z-10 group-hover:scale-110 transition-transform shadow-inner">
                    <img
                      src="/badges/last-meadow.png"
                      alt="شارات ديسكورد"
                      className="w-full h-full object-contain drop-shadow"
                    />
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="text-base sm:text-lg font-bold text-white mb-0.5 group-hover:text-[#9c84ef] transition-colors"
                  style={{ fontFamily: "'Lifta', sans-serif" }}
                >
                  شارات الديسكورد
                </h3>
                <span className="text-[11px] text-[#c7d2fe] font-mono mb-2" dir="ltr">
                  Discord Badges
                </span>

                {/* Description */}
                <p
                  className="text-[11px] sm:text-xs text-gray-300 leading-relaxed mb-4"
                  style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                >
                  تعيين وتغيير شارات ديسكورد الرسمية لملفك الشخصي بسهولة وبضغطة زر واحدة.
                </p>

                {/* CTA Pill */}
                <div
                  className="mt-auto px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 group-hover:shadow-[0_0_15px_rgba(156,132,239,0.6)] transition-all"
                  style={{
                    fontFamily: "'Lifta', sans-serif",
                    background: "linear-gradient(180deg, #9c84ef 0%, #6849c7 100%)",
                  }}
                >
                  <span>اختيار الشارة</span>
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer
        className="absolute bottom-2 md:bottom-3 left-0 right-0 flex flex-col items-center justify-center gap-1.5 select-none z-10"
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
