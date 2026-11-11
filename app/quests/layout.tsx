import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quester — المهام",
  description: "هذا البوت يستخدم في عمل مهام الديسكورد تلقائياً وبسهولة",
};

export default function QuestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

