"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type DashboardStats = { dailyGoalMinutes?: number; currentStreak?: number; bestStreak?: number; progressPercent?: number };
type PlannerItem = { id: string; title: string; subjectId?: string; date: string; durationMinutes: number; completed?: boolean };

const subjects = [
  { name: "Physics", code: "PHY", id: "physics" },
  { name: "Chemistry", code: "CHE", id: "chemistry" },
  { name: "Mathematics", code: "MAT", id: "mathematics" },
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

  // Firebase must not be part of the first browser render. If Firebase config,
  // IndexedDB, or auth restoration fails on a mobile browser, the dashboard
  // should remain usable instead of crashing with a client-side exception.
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
        unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            if (!mounted) return;
            setUid(user?.uid ?? null);
            setName(user?.displayName || user?.email?.split("@")[0] || "Student");
          },
          () => {
            if (mounted) setUid(null);
          },
        );
      } catch {
        if (mounted) {
          setUid(null);
          setMessage("Firebase is temporarily unavailable. You can still browse Lakshya.");
        }
      }
    })();

    return () => {
      mounted = false;
      unsubscribe();
    };
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

    return () => {
      active = false;
      stopDashboard();
      stopPlanner();
    };
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
  const progress = Number(stats.progressPercent) || 0;
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return <main className="page">
    <div className="hero-row"><div><p className="eyebrow">{today.toUpperCase()}</p><h1>Good day, <span>{name}.</span></h1><p className="muted">Your dashboard is connected to your Firebase account. Activity appears here as you study.</p></div><Link className="primary" href="/study">Open Study →</Link></div>
    {!uid && <section className="panel" style={{ marginBottom: 14 }}><b>Sign in to see your real progress.</b><p className="muted">Lakshya does not show sample progress or fake schedules.</p><Link className="primary" href="/auth">Sign in</Link></section>}
    <div className="stats-grid">
      <div className="stat-card main-stat"><div><p>Today&apos;s progress</p><strong>{progress}<span>%</span></strong><small>{progress ? "Recorded from your activity" : "No activity recorded yet"}</small></div><div className="ring"><div><b>{progress}%</b><small>complete</small></div></div></div>
      <div className="stat-card"><p>Study time today</p><strong>{fmt(studySeconds)}</strong>{goalMinutes > 0 ? <><div className="bar"><i style={{ width: `${goalProgress}%` }} /></div><small>Goal {Math.round(goalMinutes / 60)}h · {goalProgress}%</small></> : <small>Set a daily goal in Planner</small>}</div>
      <div className="stat-card"><p>Questions solved today</p><strong>{questions}</strong><small>{questions ? "Recorded practice attempts" : "No attempts recorded yet"}</small></div>
      <div className="stat-card"><p>Current streak</p><strong>{streak} <em>days</em></strong><small>{best ? `Best: ${best} days` : "No streak recorded yet"}</small><div className="week">M T W T F S S</div></div>
    </div>
    <div className="section-grid">
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">YOUR DAY</p><h2>Today&apos;s schedule</h2></div><Link href="/planner">Planner →</Link></div><div className="timeline">{tasks.length ? tasks.map((task, i) => <div className="timeline-item" key={task.id}><div className="time">{task.durationMinutes}m</div><div className="dot"/><div className="session"><span className={i === 0 ? "tag active-tag" : "tag"}>{task.completed ? "Done" : "Planned"}</span><h3>{task.title}</h3><small>{task.subjectId || "Study task"}</small></div></div>) : <div style={{ padding: 16 }}><p className="muted">No tasks planned for today.</p><Link className="secondary" href="/planner">Create today&apos;s first task</Link></div>}</div></section>
      <section className="panel focus-panel"><div className="panel-head"><div><p className="eyebrow">FOCUS MODE</p><h2>25 minute session</h2></div><span className="live-dot">● {running ? "FOCUSING" : "READY"}</span></div><div className="timer"><div className="timer-circle"><span>{m}:{s}</span><small>FOCUS</small></div></div><div className="timer-controls"><button onClick={() => setRunning(!running)} className="primary" disabled={!uid}>{running ? "Pause" : "Start focus"}</button><button className="secondary" onClick={() => { setRunning(false); setSeconds(1500); }}>Reset</button></div><p className="muted center">Completed sessions are saved to your Firebase study history.</p></section>
    </div>
    <section className="panel subjects-panel"><div className="panel-head"><div><p className="eyebrow">YOUR LEARNING DATA</p><h2>Subjects</h2></div><Link href="/study">Study library →</Link></div><div className="subject-grid">{subjects.map((subject) => <div className="subject" key={subject.id}><div className="subject-top"><div className="subject-icon">{subject.code}</div><span>Live</span></div><h3>{subject.name}</h3><small>Progress comes from your completed chapter records.</small><div className="bar"><i style={{ width: "0%" }} /></div></div>)}</div></section>
    {message && <p className="muted center">{message}</p>}
  </main>;
}
