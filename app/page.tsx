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
  { name: "Physics", code: "PHY", tone: "Concepts & problem solving", href: "/study/physics" },
  { name: "Chemistry", code: "CHE", tone: "Reactions & revision", href: "/study/chemistry" },
  { name: "Mathematics", code: "MAT", tone: "Practice & problem solving", href: "/study/mathematics" },
];

const todayKey = () => { const now = new Date(); const year = now.getFullYear(); const month = String(now.getMonth() + 1).padStart(2, "0"); const day = String(now.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; };
const fmt = (seconds: number) => `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("Student");
  const [greeting, setGreeting] = useState("Hello");
  const [stats, setStats] = useState<DashboardStats>({});
  const [tasks, setTasks] = useState<PlannerItem[]>([]);
  const [studySeconds, setStudySeconds] = useState(0);
  const [questions, setQuestions] = useState(0);
  const [seconds, setSeconds] = useState(1500);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
  }, []);

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
        if (mounted) setMessage("Firebase is temporarily unavailable. You can still browse Lakshya.");
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
  const progress = Math.min(100, Math.max(0, Number(stats.progressPercent) || 0));
  const streak = Number(stats.currentStreak) || 0;
  const nextTask = useMemo(() => tasks.find((task) => !task.completed), [tasks]);
  const remainingTasks = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return (
    <main className="page lakshya-dashboard">
      <section className="home-welcome">
        <div>
          <span className="home-eyebrow">YOUR STUDY SPACE</span>
          <h1>{greeting}, <span>{name}</span> 👋</h1>
          <p>Let&apos;s make today count.</p>
          <div className="home-subline">Your study space, powered by AI.</div>
        </div>
        <Link className="home-avatar" href="/profile" aria-label="Open profile">{name.slice(0, 1).toUpperCase()}</Link>
      </section>

      {!uid && (
        <section className="home-signin">
          <div><strong>Make Lakshya yours.</strong><span>Sign in to sync your study time, plans and progress.</span></div>
          <Link href="/auth/sign-in" className="home-small-button">Sign in</Link>
        </section>
      )}

      <section className="ai-study-card">
        <div className="ai-study-orb" aria-hidden="true"><span>✦</span></div>
        <div className="ai-study-copy">
          <span className="ai-study-label">LAKSHYA AI · STUDY COACH</span>
          <h2>{nextTask ? "Your next study session" : "Plan your next study session"}</h2>
          <p>{nextTask ? <>{nextTask.title} <b>•</b> {nextTask.durationMinutes} min</> : "No study session is scheduled for today. Add a task in Planner to build a plan around your goals."}</p>
        </div>
        <Link href="/planner" className="ai-study-button">{nextTask ? "View session" : "Create study plan"} <span>→</span></Link>
      </section>

      <section className="home-section">
        <div className="home-section-head"><div><span className="home-eyebrow">QUICK STUDY</span><h2>Pick up where you left off</h2></div><Link href="/study">View all →</Link></div>
        <div className="quick-study-grid">
          <Link href="/study" className="quick-study-card"><span className="quick-icon blue">↗</span><strong>Study</strong><small>Learn & revise</small><span className="quick-arrow">→</span></Link>
          <Link href="/practice" className="quick-study-card"><span className="quick-icon violet">✓</span><strong>Practice</strong><small>{questions ? `${questions} solved today` : "Sharpen concepts"}</small><span className="quick-arrow">→</span></Link>
          <Link href="/analytics" className="quick-study-card"><span className="quick-icon green">◔</span><strong>Progress</strong><small>{progress}% overall progress</small><span className="quick-arrow">→</span></Link>
        </div>
      </section>

      <section className="home-progress-grid">
        <article className="home-progress-card">
          <div className="home-card-title"><div><span className="home-eyebrow">TODAY&apos;S PROGRESS</span><h2>Keep the momentum going</h2></div><span className="progress-percent">{progress}%</span></div>
          <div className="home-progress-track"><i style={{ width: `${progress}%` }} /></div>
          <div className="progress-meta"><span>{fmt(studySeconds)} studied</span><span>{goalMinutes ? `${goalProgress}% of daily goal` : "Set a daily goal in Planner"}</span></div>
        </article>
        <article className="home-streak-card">
          <span className="home-eyebrow">CURRENT STREAK</span>
          <div className="streak-value">{streak}<small> days</small></div>
          <p>{streak ? "Nice work — keep it alive today." : "Start your first focused session today."}</p>
          <Link href="/focus">Focus now →</Link>
        </article>
      </section>

      <section className="home-section">
        <div className="home-section-head"><div><span className="home-eyebrow">FOR YOU</span><h2>Smart revision update</h2></div><Link href="/revision">Open revision →</Link></div>
        <Link href="/revision" className="revision-card">
          <span className="revision-icon">✦</span>
          <div><strong>{nextTask?.title || "Your revision plan starts here"}</strong><p>{remainingTasks ? `${remainingTasks} planned task${remainingTasks === 1 ? "" : "s"} waiting in your schedule.` : "No tasks are scheduled yet. Add your first study task in Planner to get a revision plan based on your real schedule."}</p></div>
          <span className="revision-arrow">→</span>
        </Link>
      </section>

      <section className="home-section">
        <div className="home-section-head"><div><span className="home-eyebrow">LEARNING LIBRARY</span><h2>Build your foundation</h2></div><Link href="/study">Explore all →</Link></div>
        <div className="home-subject-grid">
          {subjects.map((subject, index) => (
            <Link href={subject.href} className="home-subject-card" key={subject.code}>
              <div className={`subject-badge subject-${index + 1}`}>{subject.code}</div>
              <strong>{subject.name}</strong>
              <small>{subject.tone}</small>
              <span>Open subject →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-focus-strip">
        <div><span className="home-eyebrow">FOCUS TIMER</span><h2>{running ? "You&apos;re in a focus session." : "Ready for a focused 25 minutes?"}</h2><p>Stay distraction-free and your completed session will be saved to your study history.</p></div>
        <div className="home-timer-actions"><span>{m}:{s}</span><button className="home-primary-button" onClick={() => setRunning(!running)} disabled={!uid}>{running ? "Pause" : "Start focus"}</button></div>
      </section>

      {message && <p className="muted center">{message}</p>}
    </main>
  );
}
