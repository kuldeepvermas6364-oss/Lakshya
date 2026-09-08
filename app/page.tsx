"use client";

import { useEffect, useState } from "react";

const subjects = [
  { name: "Physics", code: "PHY", progress: 68, chapters: "8 / 12" },
  { name: "Chemistry", code: "CHE", progress: 82, chapters: "10 / 12" },
  { name: "Mathematics", code: "MAT", progress: 74, chapters: "9 / 12" },
];

const schedule = [
  ["08:30", "Deep Study", "Physics — Electrostatics", "90 min"],
  ["10:15", "Practice", "JEE Mixed Questions", "60 min"],
  ["13:00", "Revision", "Chemistry — Solutions", "45 min"],
  ["21:00", "Focus", "Mathematics — Integrals", "90 min"],
];

export default function Home() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 25 * 60)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">L</div><div><strong>Lakshya</strong><span>STUDY OS</span></div></div>
        <nav>
          {[["⌂", "Dashboard"], ["◫", "Study Planner"], ["◈", "Subjects"], ["◷", "Focus Mode"], ["▤", "Notes"], ["✓", "Practice"], ["↗", "Analytics"]].map(([icon, label], i) => <a className={i === 0 ? "active" : ""} href="#" key={label}><b>{icon}</b>{label}</a>)}
        </nav>
        <div className="sidebar-bottom"><a href="#">⚙ Settings</a><div className="streak-mini"><span>🔥</span><div><b>12 day streak</b><small>Keep the momentum.</small></div></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark">L</div><strong>Lakshya</strong></div><div className="search">⌕ <span>Search chapters, notes, questions...</span></div><div className="top-actions"><button className="icon-btn">☼</button><button className="avatar">K</button></div></header>

        <div className="page">
          <div className="hero-row"><div><p className="eyebrow">TUESDAY · 8 SEPTEMBER</p><h1>Good evening, <span>Lakshya.</span></h1><p className="muted">Small focused sessions become big results. Let&apos;s make today count.</p></div><button className="primary">+ Add study session</button></div>

          <div className="stats-grid">
            <div className="stat-card main-stat"><div><p>Today&apos;s progress</p><strong>68<span>%</span></strong><small>↑ 12% from yesterday</small></div><div className="ring"><div><b>68%</b><small>complete</small></div></div></div>
            <div className="stat-card"><p>Study time</p><strong>4h 20m</strong><div className="bar"><i style={{width:"72%"}} /></div><small>Goal 6h · 72%</small></div>
            <div className="stat-card"><p>Questions solved</p><strong>47</strong><small className="positive">↑ 8 this week</small><div className="spark">▁▂▃▂▄▅▆</div></div>
            <div className="stat-card"><p>Current streak</p><strong>12 <em>days</em></strong><small>Best: 18 days</small><div className="week">M T W T F S S</div></div>
          </div>

          <div className="section-grid">
            <section className="panel"><div className="panel-head"><div><p className="eyebrow">YOUR DAY</p><h2>Today&apos;s schedule</h2></div><a href="#">View planner →</a></div><div className="timeline">{schedule.map(([time,type,title,duration], i) => <div className="timeline-item" key={title}><div className="time">{time}</div><div className="dot" /><div className="session"><span className={i === 0 ? "tag active-tag" : "tag"}>{type}</span><h3>{title}</h3><small>{duration}</small></div><button className="more">•••</button></div>)}</div></section>

            <section className="panel focus-panel"><div className="panel-head"><div><p className="eyebrow">FOCUS MODE</p><h2>25 minute session</h2></div><span className="live-dot">● READY</span></div><div className="timer"><div className="timer-circle"><span>{minutes}:{secs}</span><small>FOCUS</small></div></div><div className="timer-controls"><button onClick={() => setRunning(!running)} className="primary">{running ? "Pause" : "Start focus"}</button><button onClick={() => {setRunning(false);setSeconds(25*60)}} className="secondary">Reset</button></div><p className="muted center">Put your phone away. One task. Full attention.</p></section>
          </div>

          <section className="panel subjects-panel"><div className="panel-head"><div><p className="eyebrow">MASTER YOUR SYLLABUS</p><h2>Subjects</h2></div><a href="#">All subjects →</a></div><div className="subject-grid">{subjects.map((s) => <div className="subject" key={s.name}><div className="subject-top"><div className="subject-icon">{s.code}</div><span>{s.progress}%</span></div><h3>{s.name}</h3><small>{s.chapters} chapters completed</small><div className="bar"><i style={{width:`${s.progress}%`}} /></div></div>)}</div></section>
        </div>
      </section>
    </main>
  );
}
