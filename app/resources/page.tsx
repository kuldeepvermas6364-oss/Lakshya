"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const resources = [
  { type: "Notes", title: "Concept notes", text: "Keep chapter explanations and your own revision notes organised by subject.", href: "/notes" },
  { type: "Practice", title: "Question practice", text: "Move from reading to active recall with chapter and subject practice.", href: "/practice" },
  { type: "Revision", title: "Mistake-led revision", text: "Use your recorded mistakes to decide what deserves another look.", href: "/revision" },
  { type: "Analytics", title: "Progress insights", text: "Review study time, accuracy and consistency from your real activity.", href: "/analytics" },
];

export default function ResourcesPage() {
  const [type, setType] = useState("All");
  const visible = useMemo(() => type === "All" ? resources : resources.filter((r) => r.type === type), [type]);
  return <main className="page feature-page"><header className="feature-hero"><div><span className="section-eyebrow">LEARNING RESOURCES</span><h1>Everything useful, without the clutter.</h1><p>A focused library for notes, practice, revision and progress—built around how students actually study.</p></div><Link className="primary" href="/study">Open Study →</Link></header><div className="filter-pills" aria-label="Resource filters">{["All","Notes","Practice","Revision","Analytics"].map((item) => <button key={item} className={type === item ? "selected" : ""} onClick={() => setType(item)}>{item}</button>)}</div><section className="resource-grid">{visible.map((r, i) => <Link className="resource-card" href={r.href} key={r.title}><div className="resource-index">0{i + 1}</div><span>{r.type}</span><h2>{r.title}</h2><p>{r.text}</p><strong>Open resource →</strong></Link>)}</section><section className="resource-note"><span className="section-eyebrow">LAKSHYA PRINCIPLE</span><h2>Real learning data should make the next decision easier.</h2><p>Resources are designed to connect with practice, revision and analytics rather than becoming another folder students forget about.</p></section></main>;
}
