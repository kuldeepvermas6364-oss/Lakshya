"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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
];

function PremiumNavIcon({ type }: { type: "home" | "study" | "practice" | "ai" | "community" | "career" }) {
  const map = {
    home: "home",
    study: "book",
    practice: "practice",
    ai: "sparkles",
    community: "users",
    career: "briefcase",
  } as const;
  return <LakshyaIcon name={map[type]} size={22} />;
}

export default function AppFrame({ children, previewMode = false }: { children: ReactNode; previewMode?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  useEffect(() => {
    // Preview mode exists only on Vercel Preview deployments. It never disables
    // authentication on production and does not create a Firebase session.
    if (previewMode) return;
    if (!loading && !user && !isAuthRoute) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [loading, user, isAuthRoute, pathname, router, previewMode]);

  if (isAuthRoute) return <>{children}</>;
  if (!previewMode && (loading || !user)) {
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
      {previewMode && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            padding: "6px 12px",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".04em",
            background: "rgba(255,255,255,.92)",
            borderBottom: "1px solid rgba(0,0,0,.08)",
          }}
          role="status"
        >
          PREVIEW MODE · Testing only · Production authentication is unchanged
        </div>
      )}

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

          <div className="frame-search">
            <LakshyaIcon name="search" size={15} />
            <span>Search chapters, notes, questions...</span>
          </div>

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
            <Link href="/profile" className="frame-avatar">K</Link>
          </div>
        </header>

        {children}
      </div>

      <nav className="frame-mobile-nav" aria-label="Mobile navigation">
        {([
          ["home", "Home", "/"],
          ["study", "Study", "/study"],
          ["practice", "Practice", "/practice"],
          ["ai", "AI", "/ai"],
          ["community", "Community", "/community"],
          ["career", "Career", "/career"],
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
