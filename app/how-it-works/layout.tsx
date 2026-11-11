import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quester — كيف يعمل",
  description: "شرح خطوات استخدام Quester Bot لإتمام مهام الديسكورد تلقائياً",
};

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

