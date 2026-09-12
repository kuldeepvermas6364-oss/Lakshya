"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { subscribeToAuth } from "../../lib/auth";

type Session = { minutes?: number; createdAt?: { toDate?: () => Date } };
type Attempt = { subject?: string; correct?: boolean; createdAt?: { toDate?: () => Date } };
type Task = { title?: string; date?: string; durationMinutes?: number; completed?: boolean };

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStreak(dates: Set<string>) {
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;
  while (dates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function readDate(value: Session["createdAt"] | Attempt["createdAt"]) {
  return value?.toDate ? value.toDate() : null;
}

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    return subscribeToAuth(async (user) => {
      setSignedIn(Boolean(user));
      if (!user) {
        setSessions([]); setAttempts([]); setTasks([]); setLoading(false); return;
      }
      setLoading(true);
      try {
        const [sessionSnap, attemptSnap, taskSnap] = await Promise.all([
          getDocs(query(collection(db, "users", user.uid, "studySessions"), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "users", user.uid, "practiceAttempts"), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "users", user.uid, "plannerTasks"), orderBy("date", "desc"))),
        ]);
        setSessions(sessionSnap.docs.map((d) => d.data() as Session));
        setAttempts(attemptSnap.docs.map((d) => d.data() as Attempt));
        setTasks(taskSnap.docs.map((d) => d.data() as Task));
      } catch (error) {
        console.warn("Lakshya analytics load skipped:", error);
      } finally { setLoading(false); }
    });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);
    const weeklySessions = sessions.filter((s) => {
      const d = readDate(s.createdAt); return d ? d >= weekStart : false;
    });
    const minutes = weeklySessions.reduce((sum, s) => sum + Number(s.minutes || 0), 0);
    const correct = attempts.filter((a) => a.correct).length;
    const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
    const activityDates = new Set<string>();
    sessions.forEach((s) => { const d = readDate(s.createdAt); if (d) activityDates.add(dateKey(d)); });
    attempts.forEach((a) => { const d = readDate(a.createdAt); if (d) activityDates.add(dateKey(d)); });
    const subjects = ["Physics", "Chemistry", "Mathematics"].map((subject) => {
      const rows = attempts.filter((a) => a.subject?.toLowerCase() === subject.toLowerCase());
      return { subject, value: rows.length ? Math.round((rows.filter((a) => a.correct).length / rows.length) * 100) : 0, count: rows.length };
    });
    const completedTasks = tasks.filter((t) => t.completed).length;
    return { minutes, weeklySessions: weeklySessions.length, accuracy, streak: getStreak(activityDates), subjects, completedTasks, totalTasks: tasks.length };
  }, [sessions, attempts, tasks]);

  const notifications = useMemo(() => {
    const items: string[] = [];
    if (!signedIn) items.push("Sign in to unlock synced progress and streaks.");
    else if (stats.streak === 0) items.push("Start a study session today to build your streak.");
    else items.push(`Nice work — your current streak is ${stats.streak} day${stats.streak === 1 ? "" : "s"}.`);
    if (stats.totalTasks && stats.completedTasks < stats.totalTasks) items.push(`${stats.totalTasks - stats.completedTasks} planner task${stats.totalTasks - stats.completedTasks === 1 ? "" : "s"} still need attention.`);
    if (stats.accuracy && stats.accuracy < 70) items.push("Practice tip: revisit explanations for questions you missed.");
    return items;
  }, [signedIn, stats]);

  return <main className="page">
    <div className="hero-row"><div><p className="eyebrow">YOUR PROGRESS</p><h1>Analytics</h1><p className="muted">A live view of your study activity, practice accuracy and consistency.</p></div></div>
    {loading ? <section className="panel"><p className="muted">Syncing your progress…</p></section> : <>
      <div className="stats-grid">
        <div className="stat-card"><p>Study this week</p><strong>{Math.floor(stats.minutes / 60)}h {stats.minutes % 60}m</strong><small>{stats.weeklySessions} recorded sessions</small></div>
        <div className="stat-card"><p>Questions</p><strong>{attempts.length}</strong><small>{stats.accuracy}% accuracy</small></div>
        <div className="stat-card"><p>Planner progress</p><strong>{stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%</strong><small>{stats.completedTasks}/{stats.totalTasks} tasks completed</small></div>
        <div className="stat-card"><p>Current streak</p><strong>{stats.streak} day{stats.streak === 1 ? "" : "s"}</strong><small>Study or practice activity</small></div>
      </div>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">SUBJECT HEALTH</p><h2>Where to focus next</h2></div></div>{stats.subjects.map(({ subject, value, count }) => <div key={subject} style={{margin:"22px 0"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><b>{subject}</b><span>{count ? `${value}%` : "No data yet"}</span></div><div className="bar"><i style={{width:`${value}%`}} /></div></div>)}</section>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">SMART REMINDERS</p><h2>Next best actions</h2></div></div><div style={{display:"grid",gap:12}}>{notifications.map((item) => <div key={item} className="notice-card">{item}</div>)}</div></section>
    </>}
  </main>;
}
