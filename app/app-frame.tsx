"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LakshyaAI from "./components/lakshya-ai";

const primary = [["⌂", "Dashboard", "/"], ["◫", "Study", "/study"], ["✓", "Practice", "/practice"], ["◷", "Focus Mode", "/focus"], ["▤", "Notes", "/notes"], ["↗", "Analytics", "/analytics"]];
const social = [["◉", "Community", "/community"], ["♙", "Friends", "/friends"], ["▣", "Messages", "/messages"], ["◆", "Study Groups", "/groups"]];
const extra = [["◎", "Goals", "/goals"], ["↻", "Revision", "/revision"], ["★", "Achievements", "/achievements"], ["♢", "Notifications", "/notifications"];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Firebase authentication is intentionally NOT used as a global render gate.
  // The dashboard and individual features already handle signed-out users.
  // Blocking the entire layout on Firebase restoration could leave the app
  // stuck on the splash screen or trigger an intermittent client navigation
  // failure on slower/mobile browsers.
  if (pathname === "/auth") return <>{children}</>;

  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const nav = [...primary, ...extra, ...social];
  return <div className="app-frame">
    <aside className="frame-sidebar">
      <Link href="/" className="frame-brand"><img src="/lakshya-mark.svg" alt="" /><div><strong>Lakshya</strong><small>STUDY OS</small></div></Link>
      <nav aria-label="Main navigation">{nav.map(([icon, label, href]) => <Link key={href} href={href} className={active(href) ? "frame-nav active" : "frame-nav"}><b>{icon}</b><span>{label}</span></Link>)}</nav>
      <div className="frame-bottom"><Link href="/settings" className={active("/settings") ? "frame-nav active" : "frame-nav"}>⚙ <span>Settings</span></Link><div className="frame-streak">✦ <span><b>Your progress</b><small>Built from your activity.</small></span></div></div>
    </aside>
    <div className="frame-content"><header className="frame-topbar"><Link href="/" className="frame-mobile-brand"><img src="/lakshya-mark.svg" alt="" /><b>Lakshya</b></Link><div className="frame-search">⌕ <span>Search chapters, notes, questions...</span></div><div className="frame-actions"><Link href="/premium" className="frame-premium-top">✦ Premium</Link><Link href="/notifications" className="frame-icon" aria-label="Notifications">♢</Link><Link href="/profile" className="frame-avatar">K</Link></div></header>{children}</div>
    <nav className="frame-mobile-nav" aria-label="Mobile navigation">{[["⌂","Home","/"],["◫","Study","/study"],["✓","Practice","/practice"],["◉","Community","/community"],["✦","Premium","/premium"]].map(([icon,label,href])=><Link key={href} href={href} className={active(href) ? (href === "/premium" ? "active premium-tab" : "active") : href === "/premium" ? "premium-tab" : ""}><b>{icon}</b><small>{label}</small></Link>)}</nav>
    <LakshyaAI />
  </div>;
}
