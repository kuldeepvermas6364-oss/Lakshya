"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { loginUser, registerUser } from "../../lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        if (!mounted) return;
        if (user) router.replace("/");
        else setReady(true);
      },
      err => {
        if (!mounted) return;
        setReady(true);
        const message = err instanceof Error ? err.message : "Authentication service is unavailable.";
        setError(message.replace("Firebase: ", "").replace(/\s*\(auth\/[^)]+\)\.?$/, ""));
      },
    );
    return () => { mounted = false; unsubscribe(); };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "register" && !name.trim()) return setError("Please enter your name.");
    setBusy(true);
    try {
      if (mode === "register") await registerUser(name, email, password);
      else await loginUser(email, password);
      router.replace("/");
    } catch (err) {
      const code = err instanceof Error ? err.message : "Authentication failed.";
      setError(code.replace("Firebase: ", "").replace(/\s*\(auth\/[^)]+\)\.?$/, ""));
    } finally { setBusy(false); }
  }

  if (!ready) return <main className="auth-splash"><div className="auth-orbit"><img src="/lakshya-mark.svg" alt="Lakshya" /></div><b>Lakshya</b><span>Preparing your study space…</span></main>;

  return (
    <main className="auth-page-premium">
      <div className="auth-orb orb-one" /><div className="auth-orb orb-two" />
      <section className="auth-showcase">
        <div className="auth-logo-wrap"><img src="/lakshya-mark.svg" alt="Lakshya logo" /></div>
        <p className="auth-kicker">LAKSHYA · STUDY OS</p>
        <h1>Turn your effort<br /><span>into your Lakshya.</span></h1>
        <p>One focused space for study, practice, revision and progress — built around your real activity.</p>
        <div className="auth-pills"><span>✦ AI Study Copilot</span><span>◈ Real Progress</span><span>◫ Smart Revision</span></div>
      </section>

      <section className="auth-card-premium" aria-labelledby="auth-title">
        <div className="auth-card-top"><span>{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</span><div className="secure-badge">⌁ Secure</div></div>
        <h2 id="auth-title">{mode === "login" ? "Sign in to Lakshya" : "Create your account"}</h2>
        <p className="auth-subtitle">{mode === "login" ? "Pick up exactly where you left off." : "Your personalized study space starts here."}</p>
        <form onSubmit={handleSubmit} className="auth-form-premium">
          {mode === "register" && <label><span>Name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" required /></label>}
          <label><span>Email</span><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required /></label>
          <label><span>Password</span><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} /></label>
          {error && <p className="auth-error-premium" role="alert">{error}</p>}
          <button className="auth-submit-premium" disabled={busy} type="submit"><span>{busy ? "Opening your space…" : mode === "login" ? "Enter Lakshya" : "Create my Lakshya"}</span><b>→</b></button>
        </form>
        <button className="auth-switch-premium" onClick={()=>{setMode(mode === "login" ? "register" : "login");setError("")}}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
        <p className="auth-note-premium">Your account data stays protected. Never share your password or OTP.</p>
      </section>
    </main>
  );
}

