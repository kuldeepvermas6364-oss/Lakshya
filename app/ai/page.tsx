"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const prompts = [
  ["Explain", "Explain a difficult concept in simple language with an example."],
  ["Quiz me", "Create 5 JEE-level MCQs on a topic I choose."],
  ["Revise", "Make a concise revision sheet for my next study session."],
  ["Plan", "Make a realistic study plan for today based on my priorities."],
];

export default function AIPage() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(text = input) {
    const value = text.trim();
    if (!value || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: value }) });
      const data = await res.json();
      setAnswer(data.text || data.error || "AI is temporarily unavailable. Please try again.");
    } catch {
      setAnswer("AI service is temporarily unavailable. Please try again.");
    } finally { setLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(); }

  return <main className="page lakshya-dashboard">
    <section className="ai-spotlight" style={{ marginTop: 0 }}>
      <div className="ai-copy"><span className="ai-badge">✦ LAKSHYA AI</span><h1 style={{fontSize:"clamp(38px,6vw,66px)",letterSpacing:"-.05em",lineHeight:1,margin:"12px 0"}}>Study smarter with your AI copilot.</h1><p>Ask for explanations, practice, revision or planning. Keep your questions focused and use the response as a learning aid.</p></div>
      <Link className="ai-cta" href="/">← Dashboard</Link>
    </section>
    <section className="panel" style={{marginTop:14,padding:22}}>
      <div className="section-heading" style={{margin:"0 0 16px"}}><div><span className="section-eyebrow">START WITH A PROMPT</span><h2>What are you working on?</h2></div></div>
      <div className="ai-chips" style={{marginBottom:18}}>{prompts.map(([label,prompt]) => <button key={label} className="secondary" onClick={() => { setInput(prompt); void ask(prompt); }}>{label}</button>)}</div>
      <div className="ai-answer-box" style={{minHeight:230,padding:20,border:"1px solid var(--border,#e7e9ef)",borderRadius:16,background:"rgba(0,0,0,.02)"}}>
        {loading ? <div className="ai-thinking"><i></i><i></i><i></i><span>Thinking…</span></div> : answer ? <p style={{whiteSpace:"pre-wrap",lineHeight:1.75,margin:0}}>{answer}</p> : <p className="muted">Your answer will appear here. Try a concept, chapter, question or study goal.</p>}
      </div>
      <form onSubmit={submit} style={{display:"flex",gap:10,marginTop:14}}><input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask Lakshya AI anything about your studies…" style={{flex:1}}/><button className="primary" disabled={!input.trim() || loading}>{loading ? "Thinking…" : "Ask AI →"}</button></form>
    </section>
  </main>;
}
