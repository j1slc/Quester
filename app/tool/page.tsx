"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ToolPage() {
  const router = useRouter();

  // Redirect to home page automatically after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden text-white px-6"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, #1a1a4e 0%, #06061a 75%)",
      }}
    >
      {/* Top logo */}
      <Link href="/" className="w-24 h-24 mb-6 relative hover:scale-105 transition-transform">
        <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
      </Link>

      {/* Main Locked Card */}
      <div
        className="w-full max-w-lg rounded-3xl p-8 md:p-10 border border-white/10 text-center relative overflow-hidden backdrop-blur-xl shadow-2xl"
        style={{
          background: "radial-gradient(circle at 50% 20%, #202058 0%, #0c0c24 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(88, 101, 242, 0.2)",
        }}
      >
        {/* Glow effect */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-[#5865F2] opacity-30 blur-3xl pointer-events-none" />

        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-4xl">
          🔒
        </div>

        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-4"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          صفحة مغلقة · Under Construction
        </span>

        <h1
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: "'Lifta', sans-serif" }}
        >
          الأداة غير متاحة حالياً
        </h1>

        <p
          className="text-gray-300 text-sm md:text-base leading-relaxed mb-6"
          style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
        >
          تم إيقاف هذه الصفحة للصيانة والتطوير، وسيتم إطلاقها قريباً مع التحديث القادم.
          <br />
          <span className="text-xs text-gray-400 mt-2 block">
            جاري تحويلك تلقائياً إلى الصفحة الرئيسية خلال ثوانٍ...
          </span>
        </p>

        <Link
          href="/"
          className="inline-block w-full py-3.5 rounded-2xl font-bold text-base text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5865F2]/40"
          style={{
            fontFamily: "'Lifta', sans-serif",
            background: "linear-gradient(135deg, #5865F2 0%, #3c45a5 100%)",
          }}
        >
          العودة للصفحة الرئيسية الآن ←
        </Link>
      </div>
    </main>
  );
}
