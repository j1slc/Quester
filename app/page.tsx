"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setShowModal(true);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1a1a4e 0%, #06061a 70%)" }}
    >
      {/* ── TOP NAV ── */}
      <nav className="absolute top-0 left-0 right-0 h-28 flex items-center justify-center px-6 md:px-12">
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

        {/* Logo — أقصى اليمين موازي تماماً لخط الروابط */}
        <Link
          href="/"
          className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 w-28 h-28 md:w-36 md:h-36 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Image
            src="/logo.png"
            alt="Quester Logo"
            fill
            className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.75)]"
            priority
          />
        </Link>
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

        {/* CTA Button */}
        <button
          onClick={handleClick}
          type="button"
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

        {/* Under Construction Notice below button if clicked */}
        {clicked && (
          <div
            className="mt-6 inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm font-semibold animate-pulse shadow-lg"
            style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
          >
            <span>🚧</span>
            <span>الموقع تحت الإنشاء والتطوير حالياً... انتظرونا قريباً!</span>
          </div>
        )}
      </div>

      {/* ── POPUP MODAL (تحت الإنشاء / قريباً) ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl p-8 border border-white/15 text-center text-white shadow-2xl overflow-hidden transform transition-all duration-300 scale-100"
            style={{
              background: "radial-gradient(circle at 50% 20%, #202058 0%, #0c0c24 100%)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(88, 101, 242, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient top light */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-[#5865F2] opacity-30 blur-3xl pointer-events-none" />

            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-4xl shadow-inner">
              🚧
            </div>

            {/* Tag */}
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3"
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              قريباً جداً · Coming Soon
            </span>

            {/* Title */}
            <h3
              className="text-2xl md:text-3xl font-bold mb-3 text-white"
              style={{ fontFamily: "'Lifta', sans-serif" }}
            >
              الموقع تحت الإنشاء
            </h3>

            {/* Body */}
            <p
              className="text-gray-300 text-sm md:text-base leading-relaxed mb-6"
              style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
            >
              نعمل حالياً على تطوير وتجهيز المنصة بأعلى معايير السرعة والأمان لتوفير تجربة استثنائية لكم.
              <br />
              <strong className="text-white mt-1 inline-block">ترقبوا الإطلاق الرسمي قريباً! 🚀</strong>
            </p>

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#5865F2]/40"
              style={{
                fontFamily: "'Lifta', sans-serif",
                background: "linear-gradient(135deg, #5865F2 0%, #3c45a5 100%)",
              }}
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
