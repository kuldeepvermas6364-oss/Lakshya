"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LakshyaAI from "./components/lakshya-ai";

const primary = [["⌂", "Dashboard", "/"], ["◫", "Study", "/study"], ["✓", "Practice", "/practice"], ["◷", "Focus Mode", "/focus"], ["▤", "Notes", "/notes"], ["↗", "Analytics", "/analytics"]];
const social = [["◉", "Community", "/community"], ["♙", "Friends", "/friends"], ["▣", "Messages", "/messages"], ["◆", "Study Groups", "/groups"]];
const extra = [["◎", "Goals", "/goals"], ["↻", "Revision", "/revision"], ["★", "Achievements", "/achievements"], ["♢", "Notifications", "/notifications"]];

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [firebaseReady, setFirebaseReady] = useState(pathname === "/auth");

  useEffect(() => {
    if (pathname === "/auth") {
      setFirebaseReady(true);
      return;
    }

    let mounted = true;
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        () => { if (mounted) setFirebaseReady(true); },
        () => { if (mounted) setFirebaseReady(true); },
      );
      return () => { mounted = false; unsubscribe(); };
    } catch {
      setFirebaseReady(true);
      return () => { mounted = false; };
    }
  }, [pathname]);

  // Do not redirect from the global layout. Firebase restoration and Next.js
  // client navigation can finish in different orders; a router.replace here
  // was causing intermittent client-side Not Found states on mobile.
  if (pathname === "/auth") return <>{children}</>;
  if (!firebaseReady) return <main className="auth-splash"><div className="auth-orbit"><img src="/lakshya-mark.svg" alt="Lakshya" /></div><b>Lakshya</b><span>Loading your study space…</span></main>;

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
