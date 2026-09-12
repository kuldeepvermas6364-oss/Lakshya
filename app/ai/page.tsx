"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { AIAction } from "@/lib/ai/types";

type Message = { id: number; role: "user" | "ai"; text: string };

const prompts: { label: string; prompt: string; action: AIAction }[] = [
  { label: "Explain", prompt: "Explain a difficult concept in simple language with an example.", action: "explain" },
  { label: "Quiz me", prompt: "Create 5 practice MCQs on a topic I choose. Keep them clear and exam-oriented.", action: "quiz" },
  { label: "Revise", prompt: "Make a concise revision sheet for my next study session.", action: "revision" },
  { label: "Plan", prompt: "Make a realistic study plan for today based on the priorities I provide.", action: "study_plan" },
];

export default function AIPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("General");
  const [error, setError] = useState("");

  const context = useMemo(() => ({
    subject,
    language: "english" as const,
  }), [subject]);

  async function ask(text = input, action: AIAction = "doubt_help") {
    const value = text.trim();
    if (!value || loading) return;
    const id = Date.now();
    setMessages((prev) => [...prev, { id, role: "user", text: value }]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, action, context }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data?.error?.message || data?.error || "AI request failed");
      setMessages((prev) => [...prev, { id: id + 1, role: "ai", text: data.text }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI service is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  return (
    <main className="page lakshya-ai-page">
      <section className="ai-spotlight" style={{ marginTop: 0 }}>
        <div className="ai-copy">
          <span className="ai-badge">✦ LAKSHYA AI · GEMINI</span>
          <h1 style={{ fontSize: "clamp(38px,6vw,66px)", letterSpacing: "-.05em", lineHeight: 1, margin: "12px 0" }}>Your study copilot.</h1>
          <p>Understand concepts, practise smarter, revise faster and build realistic study plans. Lakshya AI is designed to help you learn—not just give answers.</p>
        </div>
        <Link className="ai-cta" href="/">← Dashboard</Link>
      </section>

      <section className="panel ai-workspace" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
        <div className="ai-workspace-head">
          <div><span className="section-eyebrow">STUDY CONTEXT</span><h2>What are you working on?</h2></div>
          <label><span className="sr-only">Subject</span><select value={subject} onChange={(e) => setSubject(e.target.value)} disabled={loading}><option>General</option><option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>English</option></select></label>
        </div>

        <div className="ai-chips ai-prompt-row">{prompts.map(({ label, prompt, action }) => <button key={label} className="secondary" onClick={() => void ask(prompt, action)} disabled={loading}>{label}</button>)}</div>

        <div className="ai-conversation" aria-live="polite">
          {messages.length === 0 && !loading ? <div className="ai-empty"><div className="ai-empty-icon">✦</div><h3>Ready when you are.</h3><p>Ask a question, paste a concept you do not understand, or choose a prompt above.</p></div> : messages.map((message) => <article key={message.id} className={`ai-message ${message.role}`}><span className="ai-message-label">{message.role === "user" ? "YOU" : "LAKSHYA AI"}</span><p>{message.text}</p></article>)}
          {loading && <div className="ai-message ai"><span className="ai-message-label">LAKSHYA AI</span><div className="ai-thinking"><i></i><i></i><i></i><span>Thinking…</span></div></div>}
        </div>

        {error && <div className="ai-error" role="alert">{error} <button onClick={() => setError("")}>Dismiss</button></div>}

        <form onSubmit={submit} className="ai-composer">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Lakshya AI about a topic, question, revision or study plan…" rows={2} maxLength={4000} disabled={loading} aria-label="Ask Lakshya AI" />
          <div className="ai-composer-foot"><span>{input.length}/4000 · {subject}</span><button className="primary" disabled={!input.trim() || loading}>{loading ? "Thinking…" : "Ask AI →"}</button></div>
        </form>
      </section>

      <p className="muted center" style={{ marginTop: 12 }}>AI can make mistakes. Use it as a learning aid and verify important academic information with your textbook or teacher.</p>
      <style jsx>{`.ai-workspace-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px;border-bottom:1px solid rgba(109,93,252,.09)}.ai-workspace-head h2{margin:4px 0 0}.ai-workspace-head select{min-width:150px;padding:10px 12px;border:1px solid #e2e2ed;border-radius:11px;background:#fff;font-weight:700;color:#414357;outline:none}.ai-prompt-row{padding:14px 22px;border-bottom:1px solid rgba(109,93,252,.08);display:flex;gap:8px;flex-wrap:wrap}.ai-conversation{min-height:380px;max-height:620px;overflow:auto;padding:22px;background:linear-gradient(180deg,rgba(250,249,255,.72),rgba(255,255,255,.45))}.ai-empty{text-align:center;max-width:480px;margin:85px auto}.ai-empty-icon{width:52px;height:52px;display:grid;place-items:center;margin:auto;border-radius:17px;background:linear-gradient(135deg,#6d5dfc,#d946ef);color:#fff;font-size:24px;box-shadow:0 12px 28px rgba(109,93,252,.25)}.ai-empty h3{margin:16px 0 5px;font-size:20px}.ai-empty p{margin:0;color:#858b9a;font-size:12px;line-height:1.7}.ai-message{max-width:82%;margin:0 0 18px;padding:14px 16px;border-radius:17px;background:#fff;border:1px solid #e9e8f1;box-shadow:0 8px 24px rgba(40,35,90,.05)}.ai-message.user{margin-left:auto;background:linear-gradient(135deg,rgba(109,93,252,.1),rgba(217,70,239,.06));border-color:rgba(109,93,252,.14)}.ai-message-label{display:block;font-size:8px;font-weight:900;letter-spacing:.13em;color:#888e9d;margin-bottom:7px}.ai-message p{white-space:pre-wrap;margin:0;font-size:12px;line-height:1.75;color:#292d3a}.ai-error{margin:0 22px 12px;padding:11px 13px;border-radius:11px;background:#fff2f2;color:#9a3e3e;font-size:11px}.ai-error button{float:right;border:0;background:none;text-decoration:underline}.ai-composer{padding:16px 22px;background:rgba(255,255,255,.92);border-top:1px solid rgba(109,93,252,.09)}.ai-composer textarea{width:100%;resize:vertical;box-sizing:border-box;border:1px solid #e1e0eb;border-radius:14px;padding:13px;font:inherit;font-size:12px;outline:none;background:#fbfbff;min-height:58px}.ai-composer textarea:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(109,93,252,.09)}.ai-composer-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:9px}.ai-composer-foot span{font-size:9px;color:#8b92a1}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.ai-workspace-head{align-items:flex-start;flex-direction:column}.ai-workspace-head select{width:100%}.ai-conversation{min-height:360px;padding:14px}.ai-message{max-width:94%}.ai-composer,.ai-prompt-row{padding-left:14px;padding-right:14px}.ai-composer-foot{align-items:flex-end}.ai-composer-foot .primary{padding:10px 12px}}`}</style>
    </main>
  );
}
