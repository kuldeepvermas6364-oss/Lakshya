"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primary = [["⌂", "Dashboard", "/"], ["◫", "Study Planner", "/planner"], ["◈", "Subjects", "/subjects"], ["◷", "Focus Mode", "/focus"], ["▤", "Notes", "/notes"], ["✓", "Practice", "/practice"], ["↗", "Analytics", "/analytics"]];
const social = [["◉", "Community", "/community"], ["♙", "Friends", "/friends"], ["▣", "Messages", "/messages"], ["◆", "Study Groups", "/groups"]];
const extra = [["◎", "Goals", "/goals"], ["↻", "Revision", "/revision"], ["★", "Achievements", "/achievements"], ["♢", "Notifications", "/notifications"]];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/auth") return <>{children}</>;
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const nav = [...primary, ...extra, ...social];
  return <div className="app-frame">
    <aside className="frame-sidebar">
      <Link href="/" className="frame-brand"><span>L</span><div><strong>Lakshya</strong><small>STUDY OS</small></div></Link>
      <nav aria-label="Main navigation">{nav.map(([icon, label, href]) => <Link key={href} href={href} className={active(href) ? "frame-nav active" : "frame-nav"}><b>{icon}</b><span>{label}</span></Link>)}</nav>
      <div className="frame-bottom"><Link href="/settings" className={active("/settings") ? "frame-nav active" : "frame-nav"}>⚙ <span>Settings</span></Link><div className="frame-streak">🔥 <span><b>12 day streak</b><small>Keep the momentum.</small></span></div></div>
    </aside>
    <div className="frame-content"><header className="frame-topbar"><Link href="/" className="frame-mobile-brand"><span>L</span><b>Lakshya</b></Link><div className="frame-search">⌕ <span>Search chapters, notes, questions...</span></div><div className="frame-actions"><Link href="/notifications" className="frame-icon" aria-label="Notifications">♢</Link><Link href="/profile" className="frame-avatar">K</Link></div></header>{children}</div>
    <nav className="frame-mobile-nav" aria-label="Mobile navigation">{[["⌂","Home","/"],["◫","Plan","/planner"],["✓","Practice","/practice"],["◉","Community","/community"],["♙","Friends","/friends"]].map(([icon,label,href])=><Link key={href} href={href} className={active(href) ? "active" : ""}><b>{icon}</b><small>{label}</small></Link>)}</nav>
  </div>;
}
