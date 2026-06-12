import type { Metadata } from "next";
import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import WeChatContact from "@/components/WeChatContact";
import "./globals.css";
import "./ui-refinements.css";

export const metadata: Metadata = { title: "AI 婚纱写真选片 MVP", description: "AI 婚纱写真自助选片网站 MVP" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body><RevealOnScroll /><header className="topbar"><div className="shell topbar-inner"><Link href="/" className="brand">AI Wedding Studio</Link><nav className="nav"><WeChatContact /><Link href="/privacy">隐私说明</Link></nav></div></header>{children}</body></html>;
}
