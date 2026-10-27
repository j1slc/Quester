"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "ما هو Quester Bot وكيف يفيدني؟",
    answer:
      "هو أداة متطورة تمكنك من إتمام جميع مهمات (Quests) الديسكورد وتجميع المكافآت والشارات الحصرية تلقائياً وبسهولة تامة بدون الحاجة لتحميل الألعاب أو قضاء ساعات في اللعب.",
  },
  {
    question: "هل استخدام البوت آمن على حسابي؟",
    answer:
      "نعم، البوت يحاكي عملية اللعب الطبيعية وبث الديسكورد المعتمدة من قِبل التطبيق، ولا يطلب كلمة السر لحسابك إطلاقاً، كما يتم تشغيل المهام في بيئة محلية ومحمية.",
  },
  {
    question: "كيف أحصل على التوكن (Token) الخاص بحسابي؟",
    answer:
      "افتح موقع Discord عبر متصفحك وسجّل الدخول، ثم اضغط على زر F12 لفتح أدوات المطور (Developer Tools). توجّه بعد ذلك إلى تبويب Application، واضغط على السهم بجانب Local Storage ثم اختر رابط https://discord.com. في خانة البحث (Filter) بالأعلى، اكتب token، ثم انسخ القيمة الظاهرة بدون علامات التنصيص والصقها في الموقع لدينا.",
  },
  {
    question: "هل البوت مجاني بالكامل؟",
    answer:
      "نعم، البوت مجاني بنسبة 100% لجميع المستخدمين، ويمكنك استخدامه في أي وقت لجميع المهمات المتاحة.",
  },
  {
    question: "ماذا أفعل إذا توقفت المهمة أو حدث خطأ؟",
    answer:
      "تأكد أولاً من صحة التوكن ومن استقرار اتصال الإنترنت، وفي حال واجهت أي توقف يمكنك ببساطة الضغط على زر الإلغاء والبدء من جديد في ثوانٍ معدودة.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-start relative overflow-x-hidden pb-20"
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
          {/* الرئيسية */}
          <Link
            href="/"
            className="text-white/85 hover:text-white text-lg transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            الرئيسية
          </Link>

          {/* separator */}
          <span className="text-white/30 select-none tracking-widest">─ · ─</span>

          {/* كيف يعمل */}
          <Link
            href="/how-it-works"
            className="text-white/85 hover:text-white text-lg transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            كيف يعمل
          </Link>

          {/* separator */}
          <span className="text-white/30 select-none tracking-widest">─ · ─</span>

          {/* أسئلة شائعة (Active) */}
          <Link
            href="/faq"
            className="text-white text-lg font-bold transition-all duration-200 outline-none select-none drop-shadow-[0_0_14px_rgba(88,101,242,0.9)]"
            style={{ color: "#7289da" }}
          >
            أسئلة شائعة
          </Link>
        </div>
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
          الأسئلة الشائعة
        </h1>

        <p
          className="text-base md:text-lg text-gray-300 mb-14 max-w-xl leading-relaxed"
          style={{
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            textShadow: "1px 2px 6px rgba(0,0,0,0.8)",
          }}
        >
          إليك كل ما تحتاج لمعرفته حول استخدام{" "}
          <Link
            href="/"
            className="transition-colors duration-200 hover:brightness-125 hover:underline"
            style={{ color: "#5865f2", fontWeight: 700 }}
          >
            Quester
          </Link>
          {" "}وكيفية تشغيل مهام الديسكورد بكل أمان وسهولة.
        </p>

        {/* ── FAQ ACCORDION LIST ── */}
        <div className="w-full space-y-5 text-right" dir="rtl">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl transition-all duration-300"
                style={{
                  background: isOpen
                    ? "linear-gradient(135deg, rgba(88, 101, 242, 0.16) 0%, rgba(20, 20, 55, 0.75) 100%)"
                    : "rgba(15, 15, 40, 0.65)",
                  border: isOpen
                    ? "1px solid rgba(88, 101, 242, 0.5)"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: isOpen
                    ? "0 12px 35px rgba(88, 101, 242, 0.22), inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "0 4px 18px rgba(0, 0, 0, 0.45)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-7 py-6 flex items-center justify-between gap-5 text-right cursor-pointer select-none group"
                >
                  <span
                    className="font-bold text-lg md:text-xl transition-colors duration-200"
                    style={{
                      fontFamily: "'Lifta', sans-serif",
                      color: isOpen ? "#ffffff" : "#e4e4e7",
                      textShadow: isOpen ? "0 0 14px rgba(88,101,242,0.6)" : "none",
                    }}
                  >
                    {faq.question}
                  </span>

                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 text-xs font-bold ${
                      isOpen
                        ? "bg-[#5865F2] text-white rotate-180 shadow-[0_0_14px_rgba(88,101,242,0.8)]"
                        : "bg-white/10 text-white/70 group-hover:bg-white/20"
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="px-7 pb-6 pt-3 text-gray-300 text-sm md:text-base leading-loose border-t border-white/5"
                    style={{
                      fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                    }}
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── BACK TO HOME CTA ── */}
        <div className="mt-16 mb-8 flex flex-col items-center">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#5865F2] via-[#7289da] to-[#4752c4] opacity-80 blur-sm transition-all duration-300 group-hover:opacity-100 group-hover:blur-md" />

            <span
              className="relative flex items-center justify-center px-20 py-4.5 rounded-full text-white font-bold transition-all duration-300 min-w-[220px]"
              style={{
                fontFamily: "'Lifta', sans-serif",
                fontSize: "22px",
                background: "linear-gradient(180deg, #5865F2 0%, #3c45a5 100%)",
                boxShadow: "0 8px 25px rgba(88, 101, 242, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              العودة للرئيسية
            </span>
          </Link>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer
        className="w-full flex flex-col items-center justify-center gap-2 py-6 select-none border-t border-white/5 mt-10"
        style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
      >
        {/* Social Links */}
        <div className="flex items-center gap-3 mb-1">
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

        <p className="text-[12px] md:text-[13px] text-white/50 tracking-wider">
          Copyrights © Quester | 2026. All rights reserved. made by{" "}
          <span className="text-[#5865F2] font-semibold">Jio</span>
        </p>
      </footer>
    </main>
  );
}
