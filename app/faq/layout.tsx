import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quester — الاسئله",
  description: "الأسئلة الشائعة حول استخدام Quester Bot لمهام الديسكورد",
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

