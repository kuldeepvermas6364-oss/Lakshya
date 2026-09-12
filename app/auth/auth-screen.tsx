"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { loginUser, logoutUser, registerUser, resetPassword } from "../../lib/auth";
import { friendlyAuthError } from "../../lib/auth-errors";
import { useAuth } from "../../lib/auth-context";

export type AuthMode = "login" | "register" | "reset";

export default function AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const nextPath = params.get("next")?.startsWith("/") ? params.get("next")! : "/";

  useEffect(() => {
    if (!loading && user) router.replace(nextPath);
  }, [loading, user, router, nextPath]);

  if (loading || user) {
    return <main className="auth-splash"><div className="auth-orbit"><img src="/lakshya-mark.svg" alt="Lakshya" /></div><b>{user ? "Opening Lakshya…" : "Restoring your session…"}</b><span>Please wait a moment.</span></main>;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "register") {
        await registerUser(name, email, password);
        router.replace("/onboarding");
      } else if (mode === "login") {
        await loginUser(email, password);
        router.replace(nextPath);
      } else {
        await resetPassword(email);
        setNotice("Password reset email sent. Check your inbox and spam folder.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "login" ? "Sign in to Lakshya" : mode === "register" ? "Create your account" : "Reset your password";
  const subtitle = mode === "login" ? "Pick up exactly where you left off." : mode === "register" ? "Your personalized study space starts here." : "We’ll send a secure reset link to your email.";

  return <main className="auth-page-premium">
    <div className="auth-orb orb-one" aria-hidden="true" /><div className="auth-orb orb-two" aria-hidden="true" />
    <section className="auth-showcase">
      <Link href="/" className="auth-logo-wrap" aria-label="Back to Lakshya home"><img src="/lakshya-mark.svg" alt="Lakshya" /></Link>
      <p className="auth-kicker">LAKSHYA · STUDY OS</p>
      <h1>Turn your effort<br /><span>into your Lakshya.</span></h1>
      <p>One focused space for study, practice, revision and progress — built around your real activity.</p>
      <div className="auth-pills"><span>✦ AI Study Copilot</span><span>◈ Real Progress</span><span>◫ Smart Revision</span></div>
    </section>

    <section className="auth-card-premium" aria-labelledby="auth-title">
      <div className="auth-card-top"><span>{mode === "login" ? "WELCOME BACK" : mode === "register" ? "GET STARTED" : "ACCOUNT RECOVERY"}</span><div className="secure-badge">⌁ Secure</div></div>
      <h2 id="auth-title">{title}</h2><p className="auth-subtitle">{subtitle}</p>
      <form onSubmit={handleSubmit} className="auth-form-premium">
        {mode === "register" && <label><span>Name</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required minLength={3} maxLength={30} /></label>}
        <label><span>Email</span><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} /></label>
        {mode !== "reset" && <label><span>Password</span><div className="auth-password-wrap"><input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} maxLength={128} /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></label>}
        {error && <p className="auth-error-premium" role="alert">{error}</p>}
        {notice && <p className="auth-success-premium" role="status">{notice}</p>}
        <button className="auth-submit-premium" disabled={busy} type="submit"><span>{busy ? "Working…" : mode === "login" ? "Enter Lakshya" : mode === "register" ? "Create my Lakshya" : "Send reset link"}</span><b>→</b></button>
      </form>

      {mode === "login" && <Link className="auth-switch-premium" href="/auth/forgot-password">Forgot password?</Link>}
      {mode === "reset" && <Link className="auth-switch-premium" href="/auth/sign-in">Back to sign in</Link>}
      {mode === "login" ? <Link className="auth-switch-premium" href="/auth/sign-up">New here? Create an account</Link> : mode === "register" ? <Link className="auth-switch-premium" href="/auth/sign-in">Already have an account? Sign in</Link> : null}
      <p className="auth-note-premium">Your password is handled by Firebase Authentication. Never share your password or OTP.</p>
    </section>
  </main>;
}

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button disabled={busy} onClick={async () => { setBusy(true); await logoutUser(); router.replace("/auth/sign-in"); }} className="auth-logout-button">{busy ? "Signing out…" : "Sign out"}</button>;
}
