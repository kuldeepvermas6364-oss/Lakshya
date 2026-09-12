"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const destinations = [
  ["Study", "Subjects, chapters and learning material", "/study"],
  ["Practice", "Questions and exam-focused practice", "/practice"],
  ["Notes", "Your saved study notes", "/notes"],
  ["Community", "Student discussions and doubts", "/community"],
  ["Friends", "Find students and connections", "/friends"],
  ["AI", "Ask Lakshya AI about a topic", "/ai"],
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(([title, description]) => `${title} ${description}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <main className="page lakshya-dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="status-pulse" /> LAKSHYA SEARCH</div>
          <h1>Find what you <span>need.</span></h1>
          <p>Search is designed as a single entry point. The backend search layer can be expanded without changing this experience.</p>
          <div className="frame-search" style={{ maxWidth: 720, marginTop: 22 }}><span aria-hidden="true">⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search study, practice, notes, community..." aria-label="Search Lakshya" style={{ border: 0, outline: 0, background: "transparent", width: "100%", color: "inherit" }} /></div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><b>⌕</b><span>SEARCH</span></div></div>
      </section>

      <section className="section-heading"><div><span className="section-eyebrow">RESULTS</span><h2>{query ? `Results for “${query}”` : "Explore Lakshya"}</h2></div><span className="muted">{results.length} destination{results.length === 1 ? "" : "s"}</span></section>
      <div className="quick-grid">{results.length ? results.map(([title, description, href]) => <Link key={href} href={href}><b>→</b><span>{title}</span><small>{description}</small></Link>) : <div className="empty-state"><div className="empty-icon">⌕</div><div><h3>No matching destination</h3><p>Try a broader term such as study, practice, notes or AI.</p></div></div>}</div>
    </main>
  );
}
