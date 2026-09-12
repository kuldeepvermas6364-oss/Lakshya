"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Mistake = { id: string; subject: string; chapter: string; correct: boolean; createdAt?: { seconds?: number } };

export default function MistakesPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let unsub = () => {};
    (async () => {
      try {
        const [{ auth }, { onAuthStateChanged }] = await Promise.all([import("@/lib/firebase"), import("firebase/auth")]);
        if (!alive) return;
        unsub = onAuthStateChanged(auth, user => setUid(user?.uid ?? null), () => setUid(null));
      } catch { if (alive) setUid(null); }
    })();
    return () => { alive = false; unsub(); };
  }, []);

  useEffect(() => {
    if (!uid) { setItems([]); setLoading(false); return; }
    let alive = true;
    let unsub = () => {};
    (async () => {
      try {
        const [{ db }, { collection, onSnapshot, orderBy, query }] = await Promise.all([import("@/lib/firebase"), import("firebase/firestore")]);
        if (!alive) return;
        unsub = onSnapshot(query(collection(db, "users", uid, "practiceAttempts"), orderBy("createdAt", "desc")), snap => {
          if (!alive) return;
          setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Mistake)).filter(x => x.correct === false));
          setLoading(false);
        }, e => { if (alive) { setError(e.message); setLoading(false); } });
      } catch (e) { if (alive) { setError(e instanceof Error ? e.message : "Could not load mistakes."); setLoading(false); } }
    })();
    return () => { alive = false; unsub(); };
  }, [uid]);

  const subjects = useMemo(() => ["All", ...Array.from(new Set(items.map(x => x.subject)))], [items]);
  const filtered = filter === "All" ? items : items.filter(x => x.subject === filter);

  return <main className="page mistakes-page">
    <div className="hero-row"><div><p className="eyebrow">LEARN FROM EVERY ATTEMPT</p><h1>Mistake Book</h1><p className="muted">Every incorrect practice attempt becomes a revision signal. No invented mistakes, no fake performance.</p></div><Link className="secondary" href="/practice">Practice again →</Link></div>
    {error && <div className="practice-error">{error}</div>}
    {!uid && !loading && <section className="panel mistake-empty"><div className="mistake-icon">↗</div><h2>Sign in to build your Mistake Book</h2><p className="muted">Your incorrect attempts are saved under your account when you answer practice questions.</p><Link className="primary" href="/auth">Sign in</Link></section>}
    {uid && <>
      <section className="mistake-summary"><div><span>Incorrect attempts</span><b>{items.length}</b></div><div><span>Subjects affected</span><b>{Math.max(0, subjects.length - 1)}</b></div><div><span>Needs review</span><b>{filtered.length}</b></div></section>
      <div className="filter-row">{subjects.map(s => <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>{s}</button>)}</div>
      <section className="mistake-list">
        {loading ? <div className="panel mistake-empty"><div className="loader">✦</div><h2>Loading your mistakes…</h2></div> : filtered.length === 0 ? <div className="panel mistake-empty"><div className="mistake-icon">✓</div><h2>{items.length ? "No mistakes in this filter" : "Your Mistake Book is clear"}</h2><p className="muted">{items.length ? "Try another subject filter." : "Complete practice sessions to automatically capture concepts that need another look."}</p><Link className="primary" href="/practice">Start practice →</Link></div> : filtered.map(item => <article className="panel mistake-item" key={item.id}><div className="mistake-dot">!</div><div className="mistake-copy"><div className="mistake-tags"><span className="tag">{item.subject}</span><span className="tag">{item.chapter}</span></div><h2>Incorrect attempt</h2><p className="muted">Review this chapter and retry a focused practice set.</p></div><Link className="secondary" href={`/practice?subject=${encodeURIComponent(item.subject)}&chapter=${encodeURIComponent(item.chapter)}`}>Retry →</Link></article>)}
      </section>
    </>}
    <style jsx>{`.mistakes-page{max-width:1050px;margin:auto}.mistake-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px auto 12px;max-width:1000px}.mistake-summary>div{padding:17px;border:1px solid #e4e6ee;border-radius:15px;background:#fff;box-shadow:0 6px 20px rgba(38,44,90,.045)}.mistake-summary span,.mistake-summary b{display:block}.mistake-summary span{font-size:9px;color:#8a91a0}.mistake-summary b{font-size:24px;margin-top:5px;color:#252a3b}.filter-row{display:flex;gap:7px;overflow:auto;padding:3px 1px 13px}.filter-row button{white-space:nowrap;border:1px solid #e1e4ec;background:#fff;border-radius:999px;padding:8px 12px;font-size:9px;font-weight:800;color:#6f7585;cursor:pointer}.filter-row button.active{background:#242039;color:#fff;border-color:#242039}.mistake-list{display:grid;gap:10px}.mistake-item{display:flex;align-items:center;gap:14px;padding:17px}.mistake-dot{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#fff0f3;color:#b12f4a;font-weight:900}.mistake-copy{flex:1;min-width:0}.mistake-tags{display:flex;gap:6px;flex-wrap:wrap}.mistake-copy h2{font-size:14px;margin:8px 0 3px}.mistake-copy p{font-size:10px;margin:0}.mistake-empty{text-align:center;padding:50px 20px;max-width:900px;margin:10px auto}.mistake-empty .primary{display:inline-block;margin-top:15px}.mistake-icon{font-size:30px;color:#635bff}.loader{animation:spin 1s linear infinite;color:#635bff}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:650px){.mistake-summary{grid-template-columns:1fr}.mistake-item{align-items:flex-start;flex-wrap:wrap}.mistake-item .secondary{margin-left:50px}.mistake-copy{width:calc(100% - 52px)}}`}</style>
  </main>;
}
