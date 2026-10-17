"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import LakshyaAI from "./components/lakshya-ai";
import { useAuth } from "../lib/auth-context";
import { LakshyaIcon } from "./components/lakshya-icon";

type NavItem = [string, string, string];

const primary: NavItem[] = [
  ["home", "Dashboard", "/"],
  ["book", "Study", "/study"],
  ["practice", "Practice", "/practice"],
  ["timer", "Focus Mode", "/focus"],
  ["note", "Notes", "/notes"],
  ["chart", "Analytics", "/analytics"],
];
const social: NavItem[] = [
  ["users", "Community", "/community"],
  ["user-plus", "Friends", "/friends"],
  ["message", "Messages", "/messages"],
  ["groups", "Study Groups", "/groups"],
];
const extra: NavItem[] = [
  ["target", "Goals", "/goals"],
  ["refresh", "Revision", "/revision"],
  ["trophy", "Achievements", "/achievements"],
  ["bell", "Notifications", "/notifications"],
  ["briefcase", "Career", "/career"],
  ["music", "Music", "/music"],
];

function PremiumNavIcon({ type }: { type: "home" | "study" | "practice" | "ai" | "community" | "career" | "music" }) {
  const map = {
    home: "home",
    study: "book",
    practice: "practice",
    ai: "sparkles",
    community: "users",
    career: "briefcase",
    music: "music",
  } as const;
  return <LakshyaIcon name={map[type]} size={22} />;
}

export default function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [guest, setGuest] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("lakshya_guest_mode") === "true");
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setGuest(window.localStorage.getItem("lakshya_guest_mode") === "true");
    }
  }, []);

  useEffect(() => {
    if (loading || user || isAuthRoute) return;

    // Guest mode is stored in localStorage by the sign-in screen. Read it here
    // as well as from React state so a same-tab route transition cannot bounce
    // the visitor straight back to sign-in with stale state.
    const storedGuest =
      typeof window !== "undefined" &&
      window.localStorage.getItem("lakshya_guest_mode") === "true";

    if (storedGuest) {
      if (!guest) setGuest(true);
      return;
    }

    if (!guest) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [loading, user, guest, isAuthRoute, pathname, router]);

  if (isAuthRoute) return <>{children}</>;
  if (loading || (!user && !guest)) {
    return (
      <main className="auth-splash">
        <div className="auth-orbit">
          <img src="/lakshya-mark.svg" alt="Lakshya" />
        </div>
        <b>{loading ? "Restoring your session…" : "Opening secure sign in…"}</b>
        <span>Please wait a moment.</span>
      </main>
    );
  }

  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const nav: NavItem[] = [["sparkles", "Lakshya AI", "/ai"], ...primary, ...extra, ...social];

  return (
    <div className="app-frame">
      <aside className="frame-sidebar">
        <Link href="/" className="frame-brand">
          <img src="/lakshya-mark.svg" alt="" />
          <div>
            <strong>Lakshya</strong>
            <small>STUDY OS</small>
          </div>
        </Link>

        <nav aria-label="Main navigation">
          {nav.map(([icon, label, href]) => (
            <Link key={href} href={href} className={active(href) ? "frame-nav active" : "frame-nav"}>
              <b><LakshyaIcon name={icon} size={19} /></b>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="frame-bottom">
          <Link href="/settings" className={active("/settings") ? "frame-nav active" : "frame-nav"}>
            <b><LakshyaIcon name="settings" size={19} /></b>
            <span>Settings</span>
          </Link>

          <div className="frame-streak">
            <LakshyaIcon name="chart" size={17} />
            <span>
              <b>Your progress</b>
              <small>Built from your activity.</small>
            </span>
          </div>
        </div>
      </aside>

      <div className="frame-content">
        <header className="frame-topbar">
          <Link href="/" className="frame-mobile-brand">
            <img src="/lakshya-mark.svg" alt="" />
            <b>Lakshya</b>
          </Link>

          <Link href="/study" className="frame-search" aria-label="Browse study chapters and practice">
            <LakshyaIcon name="search" size={15} />
            <span>Browse chapters, notes and questions...</span>
          </Link>

          <div className="frame-actions">
            <Link href="/ai" className="frame-premium-top">
              <LakshyaIcon name="sparkles" size={15} /> Ask AI
            </Link>
            <Link href="/premium" className="frame-premium-top">
              <LakshyaIcon name="crown" size={15} /> Premium
            </Link>
            <Link href="/notifications" className="frame-icon" aria-label="Notifications">
              <LakshyaIcon name="bell" size={19} />
            </Link>
            {!user && <span className="frame-guest-badge" aria-label="Guest mode">Guest</span>}
            <Link href="/profile" className="frame-avatar" aria-label={user?.displayName || "Profile"}>{user?.displayName?.trim().charAt(0).toUpperCase() || "G"}</Link>
          </div>
        </header>

        {pathname === "/" && (
          <section className="home-music-promo-wrap" aria-label="Lakshya Music">
            <Link href="/music" className="home-music-promo">
              <span className="home-music-promo-art" aria-hidden="true">♫</span>
              <span className="home-music-promo-copy"><small>YOUR SOUNDTRACK</small><strong>Study with your vibe.</strong><em>Explore songs, search artists and play previews — powered by Lakshya Music.</em></span>
              <span className="home-music-promo-action">Open Music <b>→</b></span>
            </Link>
          </section>
        )}
        {children}
      </div>

      <nav className="frame-mobile-nav" aria-label="Mobile navigation">
        {([
          ["home", "Home", "/"],
          ["study", "Study", "/study"],
          ["practice", "Practice", "/practice"],
          ["ai", "AI", "/ai"],
          ["community", "Community", "/community"],
          ["music", "Music", "/music"],
        ] as const).map(([type, label, href]) => (
          <Link key={href} href={href} className={active(href) ? "active" : ""}>
            <b><PremiumNavIcon type={type} /></b>
            <small>{label}</small>
          </Link>
        ))}
      </nav>

      <LakshyaAI />
    </div>
  );
}
