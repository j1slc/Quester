import Link from "next/link";

export default function HomePage() {
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
          {/* ستريم */}
          <Link
            href="/stream"
            className="text-white/85 hover:text-white text-lg transition-all duration-200 outline-none select-none hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            ستريم
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

        {/* CTA Button — Links directly to /tool */}
        <Link
          href="/tool"
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
        </Link>
      </div>

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
