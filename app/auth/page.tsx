"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, resetPassword } from "../../lib/auth";

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Authentication failed.";
  const code = message.replace("Firebase: ", "").replace(/\s*\(auth\/[^)]+\)\.?$/, "");
  if (code.includes("auth/invalid-credential")) return "Email or password is incorrect.";
  if (code.includes("auth/user-not-found")) return "No account was found for this email.";
  if (code.includes("auth/email-already-in-use")) return "An account already exists with this email.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Please try again later.";
  if (code.includes("auth/network-request-failed")) return "Network error. Check your connection and try again.";
  return code;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try { if (mode === "register") await registerUser(name, email, password); else await loginUser(email, password); router.replace("/"); }
    catch (err) { setError(friendlyAuthError(err)); } finally { setBusy(false); }
  }

  async function handleReset() {
    setError(""); setNotice("");
    if (!email.trim()) return setError("Enter your email first.");
    setBusy(true);
    try { await resetPassword(email); setNotice("Password reset email sent. Check your inbox."); }
    catch (err) { setError(friendlyAuthError(err)); } finally { setBusy(false); }
  }

  return <main className="auth-page-premium">
    <div className="auth-orb orb-one" /><div className="auth-orb orb-two" />
    <section className="auth-showcase"><div className="auth-logo-wrap"><img src="/lakshya-mark.svg" alt="Lakshya logo" /></div><p className="auth-kicker">LAKSHYA · STUDY OS</p><h1>Turn your effort<br /><span>into your Lakshya.</span></h1><p>One focused space for study, practice, revision and progress — built around your real activity.</p><div className="auth-pills"><span>✦ AI Study Copilot</span><span>◈ Real Progress</span><span>◫ Smart Revision</span></div></section>
    <section className="auth-card-premium" aria-labelledby="auth-title"><div className="auth-card-top"><span>{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</span><div className="secure-badge">⌁ Secure</div></div><h2 id="auth-title">{mode === "login" ? "Sign in to Lakshya" : "Create your account"}</h2><p className="auth-subtitle">{mode === "login" ? "Pick up exactly where you left off." : "Your personalized study space starts here."}</p>
      <form onSubmit={handleSubmit} className="auth-form-premium">
        {mode === "register" && <label><span>Name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" required minLength={3} maxLength={30} /></label>}
        <label><span>Email</span><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} /></label>
        <label><span>Password</span><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} maxLength={128} /></label>
        {error && <p className="auth-error-premium" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
        <button className="auth-submit-premium" disabled={busy} type="submit"><span>{busy ? "Working…" : mode === "login" ? "Enter Lakshya" : "Create my Lakshya"}</span><b>→</b></button>
      </form>
      {mode === "login" && <button className="auth-switch-premium" disabled={busy} onClick={handleReset}>Forgot password?</button>}
      <button className="auth-switch-premium" onClick={()=>{setMode(mode === "login" ? "register" : "login");setError("");setNotice("")}}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
      <p className="auth-note-premium">Your account data stays protected. Never share your password or OTP.</p>
    </section>
  </main>;
}
