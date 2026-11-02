"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    if (showModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1a1a4e 0%, #06061a 70%)" }}
    >
      {/* ── TOP NAV ── */}
      <nav className="absolute top-0 left-0 right-0 h-28 flex items-center justify-center px-6 md:px-12 z-20">
        {/* الروابط في المنتصف تماماً */}
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

        {/* CTA Button — Opens Pop-up modal */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="group relative mt-7 inline-flex items-center justify-center overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
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

      {/* ── SELECTION POP-UP MODAL ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl p-6 md:p-10 border border-white/20 shadow-2xl overflow-hidden text-center transition-all duration-300 scale-100"
            style={{
              background: "radial-gradient(ellipse 95% 75% at 50% 15%, #202058 0%, #0a0a22 100%)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(88,101,242,0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 left-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer text-xl z-10"
              aria-label="إغلاق"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="mb-8">
              <span className="text-xs uppercase tracking-widest text-[#7289da] font-bold block mb-2">
                اختر الخدمة المطلوبة
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                style={{ fontFamily: "'Lifta', sans-serif" }}
              >
                ماذا تود أن تفعل اليوم؟
              </h2>
              <p
                className="text-xs md:text-sm text-gray-300 max-w-md mx-auto"
                style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
              >
                اختر بين تشغيل محرك مهام الديسكورد التلقائي أو ترقية وتطوير شارات ملفك الشخصي
              </p>
            </div>

            {/* Two Big Option Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              {/* Option 1: المهام */}
              <Link
                href="/quests"
                className="group relative rounded-2xl p-6 border border-[#5865F2]/40 bg-gradient-to-b from-[#5865F2]/15 to-transparent hover:from-[#5865F2]/30 hover:to-[#5865F2]/10 transition-all duration-300 text-right flex flex-col justify-between hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(88,101,242,0.4)] cursor-pointer"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/25 border border-[#5865F2]/40 flex items-center justify-center p-2.5 mb-4 group-hover:scale-110 transition-transform shadow-md overflow-hidden">
                    <img
                      src="/badges/quest.png"
                      alt="المهام"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3
                    className="text-2xl font-bold text-white mb-2 group-hover:text-[#7289da] transition-colors"
                    style={{ fontFamily: "'Lifta', sans-serif" }}
                  >
                    المهام
                  </h3>
                  <p
                    className="text-xs md:text-sm text-gray-300 leading-relaxed"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    إكمال مهام ألعاب ديسكورد تلقائياً بدون لعب واستلام الجوائز على حسابك فوراً.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-start">
                  <span className="text-xs font-bold text-[#7289da] flex items-center gap-1">
                    <span>تشغيل المهام</span>
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  </span>
                </div>
              </Link>

              {/* Option 2: شارات (تطوير الشارات) */}
              <Link
                href="/badges"
                className="group relative rounded-2xl p-6 border border-purple-500/40 bg-gradient-to-b from-purple-500/15 to-transparent hover:from-purple-500/30 hover:to-purple-500/10 transition-all duration-300 text-right flex flex-col justify-between hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/25 border border-purple-500/40 flex items-center justify-center p-2.5 mb-4 group-hover:scale-110 transition-transform shadow-md overflow-hidden">
                    <img
                      src="/badges/last-meadow.png"
                      alt="الشارات"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3
                    className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors"
                    style={{ fontFamily: "'Lifta', sans-serif" }}
                  >
                    الشارات
                  </h3>
                  <p
                    className="text-xs md:text-sm text-gray-300 leading-relaxed"
                    style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
                  >
                    تطوير وترقية شارات حسابك (ساعات اللعب، تنوع الألعاب، وغيرها) لأعلى لفل ممكن.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-start">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <span>تطوير الشارات</span>
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer
        className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center gap-2 select-none z-10"
        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
      >
        {/* Social Links */}
        <div className="flex items-center gap-3">
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
