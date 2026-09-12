"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ref, update } from "firebase/database";
import { auth, realtimeDb } from "../../lib/firebase";

const subjects = ["Physics", "Chemistry", "Mathematics", "Biology", "English"];

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [className, setClassName] = useState("12");
  const [goal, setGoal] = useState("JEE");
  const [selected, setSelected] = useState<string[]>(["Physics", "Chemistry", "Mathematics"]);
  const [dailyMinutes, setDailyMinutes] = useState(240);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(auth, user => {
    if (!user) router.replace("/auth?next=/onboarding"); else setUserId(user.uid);
  }), [router]);

  function toggleSubject(subject: string) {
    setSelected(current => current.includes(subject) ? current.filter(x => x !== subject) : [...current, subject].slice(0, 5));
  }

  async function finish(event: FormEvent) {
    event.preventDefault(); if (!userId || selected.length === 0) return setError("Select at least one subject.");
    setBusy(true); setError("");
    try {
      await update(ref(realtimeDb, `users/${userId}`), {
        className, examGoal: goal, subjects: selected, dailyStudyMinutes: dailyMinutes,
        onboardingComplete: true, updatedAt: Date.now(),
      });
      router.replace("/");
    } catch { setError("Could not save your setup. Please try again."); } finally { setBusy(false); }
  }

  return <main className="auth-page-premium"><div className="auth-orb orb-one"/><div className="auth-orb orb-two"/>
    <section className="auth-card-premium onboarding-card" aria-labelledby="onboarding-title">
      <div className="auth-card-top"><span>LAKSHYA SETUP · {step}/3</span><div className="secure-badge">⌁ Secure</div></div>
      <h1 id="onboarding-title">Build your study space.</h1><p className="auth-subtitle">A few choices help Lakshya personalize your dashboard.</p>
      <form onSubmit={finish}>
        {step === 1 && <div className="onboarding-step"><h2>What are you studying?</h2><div className="onboarding-options">{["11","12"].map(x=><button type="button" className={className===x?"selected":""} onClick={()=>setClassName(x)} key={x}>Class {x}</button>)}</div><div className="onboarding-options">{["JEE","NEET","Board Exams","Other"].map(x=><button type="button" className={goal===x?"selected":""} onClick={()=>setGoal(x)} key={x}>{x}</button>)}</div></div>}
        {step === 2 && <div className="onboarding-step"><h2>Pick your subjects</h2><p className="auth-subtitle">You can change these later.</p><div className="onboarding-options">{subjects.map(x=><button type="button" className={selected.includes(x)?"selected":""} onClick={()=>toggleSubject(x)} key={x}>{selected.includes(x)?"✓ ":""}{x}</button>)}</div></div>}
        {step === 3 && <div className="onboarding-step"><h2>Set your daily target</h2><p className="target-value">{Math.floor(dailyMinutes/60)}h {dailyMinutes%60}m</p><input className="study-range" type="range" min="30" max="720" step="30" value={dailyMinutes} onChange={e=>setDailyMinutes(Number(e.target.value))}/><div className="target-scale"><span>30m</span><span>12h</span></div></div>}
        {error && <p className="auth-error-premium" role="alert">{error}</p>}
        <div className="onboarding-actions">{step>1&&<button type="button" className="auth-switch-premium" onClick={()=>setStep(step-1)}>Back</button>}{step<3?<button type="button" className="auth-submit-premium" onClick={()=>setStep(step+1)}>Continue <b>→</b></button>:<button className="auth-submit-premium" disabled={busy}>{busy?"Saving…":"Finish setup"}<b>→</b></button>}</div>
      </form>
      <p className="auth-note-premium">Your preferences are stored with your Lakshya account.</p>
    </section>
  </main>;
}
