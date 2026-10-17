"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Exam = { id: string; name: string; description: string; subjects: string[]; duration: string; tone: string };

const exams: Exam[] = [
  { id: "jee", name: "JEE", description: "Focused preparation for engineering entrance exams.", subjects: ["Physics", "Chemistry", "Mathematics"], duration: "Mock tests · timed practice", tone: "Engineering" },
  { id: "neet", name: "NEET", description: "Build concepts, practise questions and analyse your preparation.", subjects: ["Physics", "Chemistry", "Biology"], duration: "Mock tests · revision", tone: "Medical" },
  { id: "boards", name: "Boards", description: "Organise chapter revision and practice for board examinations.", subjects: ["Physics", "Chemistry", "Mathematics", "Biology"], duration: "Chapter tests · revision", tone: "School" },
];

export default function ExamsPage() {
  const [selected, setSelected] = useState("all");
  const visible = useMemo(() => selected === "all" ? exams : exams.filter((e) => e.id === selected), [selected]);
  return <main className="page feature-page">
    <header className="feature-hero"><div><span className="section-eyebrow">EXAM PREPARATION</span><h1>Prepare with a plan, not pressure.</h1><p>Choose your path, practise with purpose and use your real performance to decide what to revise next.</p></div><Link className="primary" href="/practice">Start practice →</Link></header>
    <div className="filter-pills" role="tablist" aria-label="Exam filters">{[["all","All"],["jee","JEE"],["neet","NEET"],["boards","Boards"]].map(([id,label]) => <button key={id} className={selected === id ? "selected" : ""} onClick={() => setSelected(id)}>{label}</button>)}</div>
    <section className="exam-grid">{visible.map((exam) => <article className="exam-card" key={exam.id}><div className="exam-card-top"><span className="exam-code">{exam.name}</span><span className="exam-type">{exam.tone}</span></div><h2>{exam.name} preparation</h2><p>{exam.description}</p><div className="exam-subjects">{exam.subjects.map((s) => <span key={s}>{s}</span>)}</div><div className="exam-meta"><span>{exam.duration}</span><Link href={`/practice?exam=${exam.id}`}>Practise →</Link></div></article>)}</section>
    <section className="exam-tools"><div><span className="section-eyebrow">YOUR NEXT MOVE</span><h2>Turn weak areas into your next session.</h2><p>Use practice, mistakes, analytics and revision together instead of studying in isolation.</p></div><div className="tool-links"><Link href="/practice"><b>01</b><span>Practice questions<small>Build accuracy topic by topic</small></span>→</Link><Link href="/analytics"><b>02</b><span>Analyse performance<small>Find patterns in your real attempts</small></span>→</Link><Link href="/revision"><b>03</b><span>Revise mistakes<small>Return to concepts that need work</small></span>→</Link></div></section>
  </main>;
}
