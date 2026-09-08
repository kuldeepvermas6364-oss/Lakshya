"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../../lib/auth";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") await registerUser(name, email, password);
      else await loginUser(email, password);
      router.push("/");
    } catch (err) {
      const code = err instanceof Error ? err.message : "Authentication failed.";
      setError(code.replace("Firebase: ", "").replace(/\s*\(auth\/[^)]+\)\.?$/, ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-brand" href="/" aria-label="Lakshya home">L</a>
        <p className="eyebrow">LAKSHYA</p>
        <h1 id="auth-title">{mode === "login" ? "Welcome back" : "Create your Lakshya account"}</h1>
        <p className="auth-subtitle">{mode === "login" ? "Continue your study journey." : "Build your study profile and stay on track."}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required />
            </label>
          )}
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>

        <button className="auth-switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New to Lakshya? Create an account" : "Already have an account? Sign in"}
        </button>
        <p className="auth-note">Never share your password, OTP, phone number, or home address in community posts or chats.</p>
      </section>

      <style jsx>{`
        .auth-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(135deg,#f8fafc,#eef2ff)}
        .auth-card{width:min(100%,440px);background:#fff;border:1px solid #e5e7eb;border-radius:24px;padding:34px;box-shadow:0 20px 60px rgba(15,23,42,.10)}
        .auth-brand{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:#111827;color:#fff;font-weight:800;font-size:22px;text-decoration:none;margin-bottom:20px}
        .eyebrow{font-size:12px;font-weight:800;letter-spacing:.16em;color:#64748b;margin:0 0 8px}
        h1{font-size:30px;line-height:1.1;margin:0;color:#0f172a;letter-spacing:-.03em}.auth-subtitle{color:#64748b;margin:10px 0 28px}
        .auth-form{display:grid;gap:16px}.auth-form label{display:grid;gap:7px;font-size:13px;font-weight:700;color:#334155}.auth-form input{width:100%;box-sizing:border-box;border:1px solid #dbe2ea;border-radius:12px;padding:12px 13px;font:inherit;outline:none}.auth-form input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12)}
        .auth-submit{border:0;border-radius:12px;padding:13px;background:#111827;color:#fff;font-weight:800;cursor:pointer}.auth-submit:disabled{opacity:.55;cursor:wait}.auth-error{margin:0;padding:10px 12px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:13px}
        .auth-switch{width:100%;margin-top:16px;border:0;background:transparent;color:#4f46e5;font-weight:700;cursor:pointer;padding:8px}.auth-note{font-size:11px;line-height:1.5;color:#94a3b8;text-align:center;margin:18px 0 0}
        @media(max-width:520px){.auth-page{padding:14px}.auth-card{padding:26px 20px;border-radius:20px}h1{font-size:26px}}
      `}</style>
    </main>
  );
}
