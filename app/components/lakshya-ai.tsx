"use client";

import { useState } from "react";

const actions = [
  ["🧠", "Explain", "Explain this topic simply with an example."],
  ["📝", "Summary", "Give me a concise revision summary."],
  ["🗂️", "Flashcards", "Create 5 useful flashcards for revision."],
  ["⚡", "Quiz", "Create 5 MCQs and give feedback after I answer."],
  ["🎯", "Practice", "Give me 5 practice questions from this topic."],
  ["💡", "Tricky", "Give me tricky conceptual questions and explain the traps."],
  ["📅", "Plan", "Make a realistic study plan for today."],
] as const;

export default function LakshyaAI() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(text = message) {
    const value = text.trim();
    if (!value || loading) return;
    setMessage(value);
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: value }) });
      const data = await res.json();
      setAnswer(data.text || data.error || "AI is temporarily unavailable.");
    } catch {
      setAnswer("AI service is temporarily unavailable. Please try again.");
    } finally { setLoading(false); }
  }

  return <>
    <button className="lakshya-ai-fab" onClick={() => setOpen(v => !v)} aria-label="Open Lakshya AI">✦<span>AI</span></button>
    {open && <section className="lakshya-ai-panel" aria-label="Lakshya AI assistant">
      <div className="lakshya-ai-head"><div><b>✦ Lakshya AI</b><small>Your study copilot</small></div><button onClick={() => setOpen(false)} aria-label="Close">×</button></div>
      <div className="lakshya-ai-actions">{actions.map(([icon, label, prompt]) => <button key={label} onClick={() => ask(prompt)}>{icon}<span>{label}</span></button>)}</div>
      <div className="lakshya-ai-answer">{loading ? <div className="ai-thinking"><i></i><i></i><i></i><span>Thinking...</span></div> : answer ? <p>{answer}</p> : <p className="ai-placeholder">Ask anything about your studies, concepts, revision or practice.</p>}</div>
      <form onSubmit={e => { e.preventDefault(); void ask(); }} className="lakshya-ai-input"><input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask Lakshya AI..." /><button disabled={!message.trim() || loading}>↑</button></form>
    </section>}
  </>;
}
