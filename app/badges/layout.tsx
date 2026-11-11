import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quester — الشارات",
  description: "احصل على أي شارة ديسكورد HypeSquad (Bravery, Brilliance, Balance) لملفك الشخصي بضغطة زر واحدة مجاناً وبكل أمان.",
};

export default function BadgesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
