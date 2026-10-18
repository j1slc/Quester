"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Platform = "windows" | "ios" | "android";

interface PlatformVideo {
  title: string;
  badge: string;
  isYouTube?: boolean;
  videoSrc: string; // رابط MP4 محلي أو رابط embed لليوتيوب
}

const videos: Record<Platform, PlatformVideo> = {
  windows: {
    title: "فيديو شرح استخراج التوكن على Windows",
    badge: "Windows PC",
    videoSrc: "/videos/windows.mp4",
  },
  ios: {
    title: "فيديو شرح استخراج التوكن على iPhone (iOS)",
    badge: "Apple iOS",
    videoSrc: "/videos/ios.mp4",
  },
  android: {
    title: "فيديو شرح استخراج التوكن على Android",
    badge: "YouTube Video",
    isYouTube: true,
    videoSrc: "https://www.youtube.com/embed/zlvR5Rm-KYM",
  },
};

export default function HowItWorksPage() {
  const [platform, setPlatform] = useState<Platform>("windows");
  const [copied, setCopied] = useState(false);

  const currentVideo = videos[platform];

  // كود استخراج التوكن للـ iOS والـ Android
  const tokenScript =
    "javascript:(function()%7Blocation.reload()%3Bvar%20i%20%3D%20document.createElement('iframe')%3Bdocument.body.appendChild(i)%3Balert(i.contentWindow.localStorage.token)%7D)()";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tokenScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start relative overflow-x-hidden pb-20 text-white"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, #1a1a4e 0%, #06061a 75%)",
      }}
    >
      {/* ── TOP NAV ── */}
      <nav className="w-full h-28 flex items-center justify-center px-6 md:px-12 relative z-20">
        {/* الروابط في المنتصف تماماً */}
        <div
          className="flex items-center gap-6"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          {/* كيف يعمل (Active) */}
          <Link
            href="/how-it-works"
            className="text-white text-lg font-bold transition-all duration-200 outline-none select-none drop-shadow-[0_0_14px_rgba(88,101,242,0.9)]"
            style={{ color: "#7289da" }}
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

      {/* ── CONTENT CONTAINER ── */}
      <div className="flex flex-col items-center text-center px-6 w-full max-w-4xl mt-10 md:mt-14 z-10">
        {/* Header Title */}
        <h1
          className="select-none mb-4"
          style={{
            fontFamily: "'Lifta', sans-serif",
            fontSize: "clamp(40px,6vw,60px)",
            color: "#ffffff",
            textShadow: "0 4px 18px rgba(0,0,0,0.85), 0 0 35px rgba(88,101,242,0.4)",
          }}
        >
          كيف يعمل؟
        </h1>

        <p
          className="text-base md:text-lg text-gray-300 mb-10 max-w-xl leading-relaxed"
          style={{
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            textShadow: "1px 2px 6px rgba(0,0,0,0.8)",
          }}
        >
          اختر نظام تشغيل جهازك لمشاهدة فيديو الشرح العملي لطريقة تشغيل مهام ديسكورد عبر{" "}
          <span style={{ color: "#5865f2", fontWeight: 700 }}>Quester</span>.
        </p>

        {/* ── 3 PLATFORM BUTTONS ── */}
        <div className="w-full flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10">
          {/* Windows Button */}
          <button
            onClick={() => setPlatform("windows")}
            className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer select-none ${
              platform === "windows"
                ? "scale-105"
                : "opacity-75 hover:opacity-100 hover:scale-[1.02]"
            }`}
            style={{
              fontFamily: "'Lifta', sans-serif",
              fontSize: "19px",
              background:
                platform === "windows"
                  ? "linear-gradient(180deg, #0078D4 0%, #005a9e 100%)"
                  : "rgba(15, 15, 40, 0.65)",
              border:
                platform === "windows"
                  ? "1px solid rgba(0, 120, 212, 0.8)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                platform === "windows"
                  ? "0 8px 25px rgba(0, 120, 212, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)"
                  : "0 4px 15px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <svg
              className="w-6 h-6 shrink-0"
              viewBox="0 0 24 24"
              fill={platform === "windows" ? "#ffffff" : "#0078D4"}
            >
              <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
            </svg>
            <span>Windows</span>
          </button>

          {/* iPhone Button */}
          <button
            onClick={() => setPlatform("ios")}
            className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer select-none ${
              platform === "ios"
                ? "scale-105"
                : "opacity-75 hover:opacity-100 hover:scale-[1.02]"
            }`}
            style={{
              fontFamily: "'Lifta', sans-serif",
              fontSize: "19px",
              background:
                platform === "ios"
                  ? "linear-gradient(180deg, #3a3a4c 0%, #1c1c28 100%)"
                  : "rgba(15, 15, 40, 0.65)",
              border:
                platform === "ios"
                  ? "1px solid rgba(255, 255, 255, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                platform === "ios"
                  ? "0 8px 25px rgba(255, 255, 255, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.35)"
                  : "0 4px 15px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <svg
              className="w-6 h-6 shrink-0"
              viewBox="0 0 24 24"
              fill={platform === "ios" ? "#ffffff" : "#e0e0e0"}
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1.01.08 2.03-.5 2.64-1.24" />
            </svg>
            <span>iPhone</span>
          </button>

          {/* Android Button */}
          <button
            onClick={() => setPlatform("android")}
            className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer select-none ${
              platform === "android"
                ? "scale-105"
                : "opacity-75 hover:opacity-100 hover:scale-[1.02]"
            }`}
            style={{
              fontFamily: "'Lifta', sans-serif",
              fontSize: "19px",
              background:
                platform === "android"
                  ? "linear-gradient(180deg, #3DDC84 0%, #208e50 100%)"
                  : "rgba(15, 15, 40, 0.65)",
              border:
                platform === "android"
                  ? "1px solid rgba(61, 220, 132, 0.8)"
                  : "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow:
                platform === "android"
                  ? "0 8px 25px rgba(61, 220, 132, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.35)"
                  : "0 4px 15px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(12px)",
              color: platform === "android" ? "#06061a" : "#ffffff",
            }}
          >
            <svg
              className="w-6 h-6 shrink-0"
              viewBox="0 0 24 24"
              fill={platform === "android" ? "#06061a" : "#3DDC84"}
            >
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.1 12 8.1s-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
            </svg>
            <span>Android</span>
          </button>
        </div>

        {/* ── VIDEO PLAYER CONTAINER ── */}
        <div className={`w-full transition-all duration-300 ${platform === "ios" ? "max-w-xs md:max-w-sm" : "max-w-3xl"}`}>
          {/* Video Header Badge */}
          <div className="flex items-center justify-between mb-4 px-2">
            <h2
              className="text-xl md:text-2xl font-bold text-white flex items-center gap-2"
              style={{ fontFamily: "'Lifta', sans-serif" }}
            >
              <span>🎬</span>
              <span>{currentVideo.title}</span>
            </h2>
            <span className="text-xs px-3.5 py-1.5 rounded-full bg-[#5865F2]/20 text-[#7289da] font-sans border border-[#5865F2]/30 font-semibold">
              {currentVideo.badge}
            </span>
          </div>

          {/* Video Frame Card */}
          <div
            className={`w-full rounded-3xl overflow-hidden relative transition-all duration-300 flex items-center justify-center group ${
              platform === "ios" ? "aspect-[9/16] max-h-[70vh]" : "aspect-video"
            }`}
            style={{
              background: "rgba(10, 10, 25, 0.8)",
              border: "1px solid rgba(88, 101, 242, 0.35)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(88, 101, 242, 0.15)",
              backdropFilter: "blur(14px)",
            }}
          >
            {currentVideo.isYouTube ? (
              /* YouTube Iframe Player للأندرويد */
              <iframe
                key={currentVideo.videoSrc}
                src={currentVideo.videoSrc}
                title={currentVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              /* HTML5 Video Element لـ Windows و iOS */
              <video
                key={currentVideo.videoSrc}
                controls
                playsInline
                className={`w-full h-full ${platform === "ios" ? "object-contain bg-black" : "object-cover"}`}
                poster={`/thumbnails/${platform}.png`}
              >
                <source src={currentVideo.videoSrc} type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو المباشر.
              </video>
            )}
          </div>

          {/* ── خانة نسخ نص التوكن (تظهر فقط في iOS و Android) ── */}
          {(platform === "ios" || platform === "android") && (
            <div className="w-full mt-8 text-right" dir="rtl">
              <div className="flex items-center justify-between mb-2 px-1">
                <span
                  className="text-lg font-bold text-white flex items-center gap-2"
                  style={{ fontFamily: "'Lifta', sans-serif" }}
                >
                  <span className="text-[#5865F2]">📋</span>
                  <span>نص التوكن (اضغط للنسخ)</span>
                </span>
                <span className="text-xs text-gray-400 font-sans">
                  {platform === "ios" ? "خاص بـ iPhone" : "خاص بـ Android"}
                </span>
              </div>

              {/* Copy Box Container */}
              <div
                onClick={copyToClipboard}
                className="group relative p-4 md:p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-4 select-none"
                style={{
                  background: copied
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(10, 30, 20, 0.75) 100%)"
                    : "rgba(15, 15, 40, 0.7)",
                  border: copied
                    ? "1px solid rgba(52, 211, 153, 0.6)"
                    : "1px solid rgba(88, 101, 242, 0.35)",
                  boxShadow: copied
                    ? "0 8px 25px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                  backdropFilter: "blur(14px)",
                }}
              >
                {/* Script text preview */}
                <div className="flex-1 overflow-hidden">
                  <p
                    className="font-mono text-xs md:text-sm text-gray-300 truncate"
                    dir="ltr"
                  >
                    {tokenScript}
                  </p>
                </div>

                {/* Copy Status Badge / Button */}
                <div
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shrink-0 transition-all duration-300 ${
                    copied
                      ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)]"
                      : "bg-[#5865F2] text-white group-hover:bg-[#6975f5] shadow-[0_0_15px_rgba(88,101,242,0.5)]"
                  }`}
                  style={{ fontFamily: "'Lifta', sans-serif" }}
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>تم النسخ بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>نسخ النص</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CTA BUTTON ── */}
        <div className="mt-14 mb-8 flex flex-col items-center">
          <Link
            href="/tool"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#4752c4] opacity-80 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md" />

            <span
              className="relative flex items-center justify-center px-20 py-4.5 rounded-full text-white font-bold transition-all duration-300 min-w-[240px]"
              style={{
                fontFamily: "'Lifta', sans-serif",
                fontSize: "22px",
                background: "linear-gradient(180deg, #5865F2 0%, #3c45a5 100%)",
                boxShadow: "0 8px 25px rgba(88, 101, 242, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              ابدأ الآن
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
