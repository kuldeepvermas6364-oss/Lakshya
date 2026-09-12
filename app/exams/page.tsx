"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const exams = [
  { id: "jee", name: "JEE", subtitle: "Engineering entrance", subjects: ["Physics", "Chemistry", "Mathematics"], href: "/practice" },
  { id: "neet", name: "NEET", subtitle: "Medical entrance", subjects: ["Physics", "Chemistry", "Biology"], href: "/practice" },
  { id: "boards", name: "Boards", subtitle: "Class 9–12 preparation", subjects: ["Physics", "Chemistry", "Mathematics", "Biology"], href: "/study" },
];

const quick = [
  ["Mock test", "Timed exam-style practice", "/practice"],
  ["Mistake book", "Revise questions you missed", "/mistakes"],
  ["Analytics", "See your real performance", "/analytics"],
  ["Lakshya AI", "Get contextual study help", "/ai"],
];

export default function ExamsPage() {
  const [selected, setSelected] = useState("jee");
  const exam = useMemo(() => exams.find((item) => item.id === selected) ?? exams[0], [selected]);

  return (
    <main className="page lakshya-dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-pulse" /> EXAM PREPARATION</div>
          <h1>Prepare with a <span>clear plan.</span></h1>
          <p>Practice, review mistakes and understand your performance without filling your day with noise. Lakshya keeps your preparation focused.</p>
          <div className="hero-actions">
            <Link className="primary hero-cta" href="/practice">Start practice <span>→</span></Link>
            <Link className="ghost-cta" href="/analytics">View performance</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" />
          <div className="orbit-core"><b>{exam.name}</b><span>PREP</span></div>
        </div>
      </section>

      <section className="section-heading">
        <div><span className="section-eyebrow">CHOOSE YOUR PATH</span><h2>Exam preparation</h2></div>
        <span className="muted">Your selection shapes recommendations.</span>
      </section>

      <div className="subject-grid premium-subjects">
        {exams.map((item) => (
          <button key={item.id} type="button" onClick={() => setSelected(item.id)} className={`subject premium-subject ${selected === item.id ? "selected" : ""}`} aria-pressed={selected === item.id}>
            <div className="subject-top"><div className="subject-icon">{item.name}</div><span>{selected === item.id ? "Selected" : "Choose"}</span></div>
            <h3>{item.name}</h3><small>{item.subtitle}</small>
            <div className="ai-chips">{item.subjects.map((subject) => <span key={subject}>{subject}</span>)}</div>
          </button>
        ))}
      </div>

      <section className="panel premium-grid" style={{ marginTop: 24 }}>
        <div>
          <span className="section-eyebrow">{exam.name} PATH</span>
          <h2>Build your next session</h2>
          <p className="muted">Start with a focused practice set, then use your mistakes and analytics to decide what comes next.</p>
          <div className="hero-actions"><Link className="primary" href={exam.href}>Open practice</Link><Link className="secondary" href="/planner">Plan revision</Link></div>
        </div>
        <div className="stats-grid premium-stats">
          <article className="stat-card"><div className="stat-label"><span className="metric-icon">✓</span><span>Practice</span></div><strong>Real data</strong><small className="stat-foot">Your attempts drive this area.</small></article>
          <article className="stat-card"><div className="stat-label"><span className="metric-icon">↗</span><span>Progress</span></div><strong>Tracked</strong><small className="stat-foot">No fabricated scores or ranks.</small></article>
        </div>
      </section>

      <section className="quick-actions">
        <div><span className="section-eyebrow">STUDY TOOLS</span><h2>Move from practice to improvement.</h2></div>
        <div className="quick-grid">{quick.map(([title, description, href]) => <Link key={href} href={href}><b>✦</b><span>{title}</span><small>{description}</small></Link>)}</div>
      </section>
    </main>
  );
}
