"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardStats = {
  dailyGoalMinutes?: number;
  currentStreak?: number;
  bestStreak?: number;
  progressPercent?: number;
};
type PlannerItem = {
  id: string;
  title: string;
  subjectId?: string;
  date: string;
  durationMinutes: number;
  completed?: boolean;
};

const subjects = [
  { name: "Physics", code: "PHY", id: "physics", tone: "Concepts & problem solving", href: "/study/physics" },
  { name: "Chemistry", code: "CHE", id: "chemistry", tone: "Concepts, reactions & revision", href: "/study/chemistry" },
  { name: "Mathematics", code: "MAT", id: "mathematics", tone: "Practice & problem solving", href: "/study/mathematics" },
];

const todayKey = () => new Date().toISOString().slice(0, 10);
const fmt = (seconds: number) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("Student");
  const [stats, setStats] = useState<DashboardStats>({});
  const [tasks, setTasks] = useState<PlannerItem[]>([]);
  const [studySeconds, setStudySeconds] = useState(0);
  const [questions, setQuestions] = useState(0);
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    (async () => {
      try {
        const [{ auth }, { onAuthStateChanged }] = await Promise.all([
          import("@/lib/firebase"),
          import("firebase/auth"),
        ]);
        if (!mounted) return;
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!mounted) return;
          setUid(user?.uid ?? null);
          setName(user?.displayName || user?.email?.split("@")[0] || "Student");
        }, () => mounted && setUid(null));
      } catch {
        if (mounted) {
          setUid(null);
          setMessage("Firebase is temporarily unavailable. You can still browse Lakshya.");
        }
      }
    })();
    return () => { mounted = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    let stopDashboard = () => {};
    let stopPlanner = () => {};
    (async () => {
      try {
        const data = await import("@/lib/dashboard-data");
        if (!active) return;
        stopDashboard = data.subscribeToDashboard(uid, (value) => setStats(value ?? {}), (error) => setMessage(error.message));
        stopPlanner = data.subscribeToPlanner(uid, todayKey(), setTasks, (error) => setMessage(error.message));
        const since = new Date(new Date().setHours(0, 0, 0, 0));
        data.getStudyTotals(uid, since).then((value) => active && setStudySeconds(value)).catch((error) => active && setMessage(error.message));
        data.getPracticeCount(uid, since).then((value) => active && setQuestions(value)).catch((error) => active && setMessage(error.message));
      } catch {
        if (active) setMessage("Your progress data is temporarily unavailable.");
      }
    })();
    return () => { active = false; stopDashboard(); stopPlanner(); };
  }, [uid]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          setRunning(false);
          if (uid) {
            import("@/lib/study-storage")
              .then(({ saveStudySession }) => saveStudySession(uid, "focus", 25))
              .then(() => import("@/lib/dashboard-data"))
              .then(({ getStudyTotals }) => getStudyTotals(uid, new Date(new Date().setHours(0, 0, 0, 0))))
              .then(setStudySeconds)
              .catch((error) => setMessage(error.message));
          }
          return 1500;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, uid]);

  const goalMinutes = Number(stats.dailyGoalMinutes) || 0;
  const goalProgress = goalMinutes ? Math.min(100, Math.round((studySeconds / 60 / goalMinutes) * 100)) : 0;
  const streak = Number(stats.currentStreak) || 0;
  const best = Number(stats.bestStreak) || 0;
  const progress = Math.min(100, Math.max(0, Number(stats.progressPercent) || 0));
  const remainingTasks = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="page lakshya-dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-pulse" /> {today.toUpperCase()}</div>
          <h1>Good day, <span>{name}.</span></h1>
          <p>One focused session at a time. Keep your momentum, practise what matters and let Lakshya guide your next step.</p>
          <div className="hero-actions">
            <Link className="primary hero-cta" href="/study">Start learning <span>→</span></Link>
            <Link className="ghost-cta" href="/planner">View today&apos;s plan</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="orbit-core"><b>L</b><span>LAKSHYA</span></div>
        </div>
      </section>

      {!uid && (
        <section className="notice-card">
          <div><strong>Make this dashboard yours.</strong><p>Sign in to sync your real study time, progress, plans and practice history.</p></div>
          <Link className="primary" href="/auth">Sign in</Link>
        </section>
      )}

      <section className="section-heading">
        <div><span className="section-eyebrow">YOUR MOMENTUM</span><h2>Today at a glance</h2></div>
        <Link href="/analytics">View analytics →</Link>
      </section>

      <div className="stats-grid premium-stats">
        <article className="stat-card featured-stat">
          <div className="stat-label"><span className="metric-icon">↗</span><span>Overall progress</span></div>
          <div className="metric-row"><strong>{progress}<small>%</small></strong><div className="ring progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><span>{progress}%</span></div></div>
          <small className="stat-foot">Based on your recorded learning activity</small>
        </article>
        <article className="stat-card">
          <div className="stat-label"><span className="metric-icon">◷</span><span>Study time</span></div>
          <strong>{fmt(studySeconds)}</strong>
          {goalMinutes > 0 ? <><div className="bar"><i style={{ width: `${goalProgress}%` }} /></div><small className="stat-foot">Daily goal · {goalProgress}% complete</small></> : <small className="stat-foot">Set a daily goal in Planner</small>}
        </article>
        <article className="stat-card">
          <div className="stat-label"><span className="metric-icon">✓</span><span>Questions</span></div>
          <strong>{questions}</strong><small className="stat-foot">Questions solved today</small>
          <Link className="mini-link" href="/practice">Practise now →</Link>
        </article>
        <article className="stat-card streak-stat">
          <div className="stat-label"><span className="metric-icon">✦</span><span>Study streak</span></div>
          <strong>{streak}<small> days</small></strong><small className="stat-foot">{best ? `Best streak: ${best} days` : "Start building your streak"}</small>
          <div className="week-strip"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
        </article>
      </div>

      <div className="section-grid premium-grid">
        <section className="panel schedule-panel">
          <div className="panel-head"><div><span className="section-eyebrow">PLAN</span><h2>Today&apos;s schedule</h2></div><Link href="/planner">Open planner →</Link></div>
          <div className="schedule-summary"><span>{remainingTasks} remaining</span><span>{tasks.length} planned today</span></div>
          <div className="timeline">
            {tasks.length ? tasks.slice(0, 5).map((task, i) => (
              <div className={`timeline-item ${task.completed ? "is-done" : ""}`} key={task.id}>
                <div className="time">{task.durationMinutes}m</div><div className="dot" /><div className="session"><span className={`tag ${i === 0 && !task.completed ? "active-tag" : ""}`}>{task.completed ? "Completed" : i === 0 ? "Next up" : "Planned"}</span><h3>{task.title}</h3><small>{task.subjectId || "Study task"}</small></div>
              </div>
            )) : <div className="empty-state"><div className="empty-icon">＋</div><div><h3>No plan for today</h3><p>Turn your goal into a simple, realistic study session.</p><Link className="secondary" href="/planner">Create today&apos;s plan</Link></div></div>}
          </div>
        </section>

        <section className="panel focus-panel premium-focus">
          <div className="panel-head"><div><span className="section-eyebrow">FOCUS MODE</span><h2>Deep work, distraction-free</h2></div><span className="live-dot">● {running ? "FOCUSING" : "READY"}</span></div>
          <div className="timer"><div className="timer-circle premium-timer"><span>{m}:{s}</span><small>FOCUS</small></div></div>
          <div className="timer-controls"><button onClick={() => setRunning(!running)} className="primary" disabled={!uid}>{running ? "Pause session" : "Start 25 min"}</button><button className="secondary" onClick={() => { setRunning(false); setSeconds(1500); }}>Reset</button></div>
          <p className="muted center">Your completed session is saved to your study history.</p>
        </section>
      </div>

      <section className="ai-spotlight">
        <div className="ai-glow" aria-hidden="true" />
        <div className="ai-copy"><span className="ai-badge">✦ LAKSHYA AI</span><h2>Your study copilot, whenever you need it.</h2><p>Get concepts explained simply, create practice questions, revise a chapter or build a realistic plan with Gemini-powered Lakshya AI.</p><div className="ai-chips"><span>Explain concepts</span><span>Generate a quiz</span><span>Make a study plan</span></div></div>
        <Link className="ai-cta" href="/ai">Open Lakshya AI <span>→</span></Link>
      </section>

      <section className="subjects-section">
        <div className="section-heading"><div><span className="section-eyebrow">LEARNING LIBRARY</span><h2>Keep building your foundation</h2></div><Link href="/study">Explore all →</Link></div>
        <div className="subject-grid premium-subjects">
          {subjects.map((subject) => <Link href={subject.href} className="subject premium-subject" key={subject.id}><div className="subject-top"><div className="subject-icon">{subject.code}</div><span>Explore</span></div><h3>{subject.name}</h3><small>{subject.tone}</small><div className="bar"><i style={{ width: "0%" }} /></div><span className="subject-link">Open subject →</span></Link>)}
        </div>
      </section>

      <section className="quick-actions">
        <div><span className="section-eyebrow">QUICK ACCESS</span><h2>Everything you need, one tap away.</h2></div>
        <div className="quick-grid"><Link href="/practice"><b>✓</b><span>Practice</span><small>Sharpen your concepts</small></Link><Link href="/focus"><b>◷</b><span>Focus</span><small>Start a study session</small></Link><Link href="/community"><b>◎</b><span>Community</span><small>Learn with other students</small></Link><Link href="/messages"><b>◌</b><span>Friends</span><small>Discuss &amp; learn together</small></Link></div>
      </section>

      {message && <p className="muted center">{message}</p>}
    </main>
  );
}
