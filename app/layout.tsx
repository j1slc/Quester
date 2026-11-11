import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import SiteStatus from "@/components/SiteStatus";

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-ibm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quester — Discord Quest Bot",
  description: "هذا البوت يستخدم في عمل مهام الديسكورد تلقائياً وبسهولة",
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/icon.png?v=2",
    apple: "/icon.png?v=2",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlex.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <SiteStatus />
      </body>
    </html>
  );
}
