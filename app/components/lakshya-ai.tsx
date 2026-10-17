"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { cleanAIText } from "@/lib/ai/format";

const actions = [
  ["🧠", "Explain", "Explain the current topic simply with an example."],
  ["📝", "Summary", "Give me a concise revision summary for what I am working on."],
  ["🗂️", "Flashcards", "Create 5 useful flashcards from the current study context."],
  ["⚡", "Quiz", "Create 5 exam-level MCQs from the current study context and explain my mistakes."],
  ["🎯", "Practice", "Give me 5 practice questions from the current study context."],
  ["💡", "Tricky", "Give me tricky conceptual questions from the current study context and explain the traps."],
  ["📅", "Plan", "Make a realistic study plan using the current Lakshya context."],
] as const;

const routeContext: Record<string, string> = {
  "/": "Dashboard: help the student prioritize today's learning, weak areas, goals and next best action.",
  "/study": "Study workspace: explain chapters, concepts, formulas, examples and learning order.",
  "/practice": "Practice workspace: generate questions, hints, solutions, mistake analysis and targeted practice.",
  "/focus": "Focus Mode: help with focus sessions, realistic targets, breaks and distraction-free study strategy.",
  "/notes": "Notes workspace: summarize notes, organize them, extract key points and create revision material.",
  "/analytics": "Analytics: interpret study activity, identify weak/strong areas and suggest actionable improvements.",
  "/community": "Community: help students discuss academic topics, explain doubts and write useful study posts.",
  "/friends": "Friends: help with collaborative study, doubt discussions and study planning with friends.",
  "/messages": "Messages: assist with academic conversations, explanations and collaborative study support.",
  "/groups": "Study Groups: help plan group study, divide topics, create quizzes and coordinate revision.",
  "/goals": "Goals: turn academic goals into measurable milestones and realistic weekly actions.",
  "/revision": "Revision: create spaced-revision plans, rapid summaries, flashcards and recall practice.",
  "/achievements": "Achievements: help interpret progress and suggest the next achievable learning milestone.",
  "/notifications": "Notifications: help the student decide which study reminders or tasks need attention.",
  "/storage": "Storage: help organize study materials, notes and uploaded learning resources.",
  "/premium": "Premium: explain available study capabilities and how AI can improve the student's workflow.",
};

function getContext(pathname: string) {
  const exact = routeContext[pathname];
  if (exact) return exact;
  const match = Object.keys(routeContext).find((key) => key !== "/" && pathname.startsWith(`${key}/`));
  return match ? routeContext[match] : `Current Lakshya section: ${pathname}. Help the student with the task visible on this screen.`;
}

export default function LakshyaAI() {
  const pathname = usePathname() || "/";
  const pageContext = useMemo(() => getContext(pathname), [pathname]);
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
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value, context: pageContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setAnswer(cleanAIText(data.text || "No response was returned."));
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "AI service is temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask();
  }

  return <>
    <button className="lakshya-ai-fab" onClick={() => setOpen((v) => !v)} aria-label="Open Lakshya AI">✦<span>AI</span></button>
    {open && <section className="lakshya-ai-panel" aria-label="Lakshya AI assistant">
      <div className="lakshya-ai-head">
        <div><b>✦ Lakshya AI</b><small>Your study copilot · {pathname === "/" ? "Dashboard" : pathname.replaceAll("/", " · ").replace(/^ · /, "")}</small></div>
        <button onClick={() => setOpen(false)} aria-label="Close">×</button>
      </div>
      <div className="lakshya-ai-actions">{actions.map(([icon, label, prompt]) => <button key={label} onClick={() => void ask(prompt)} disabled={loading}>{icon}<span>{label}</span></button>)}</div>
      <div className="lakshya-ai-answer" aria-live="polite">{loading ? <div className="ai-thinking"><i></i><i></i><i></i><span>Thinking…</span></div> : answer ? <p>{answer}</p> : <p className="ai-placeholder">AI is connected to this Lakshya section. Ask about what you are doing here.</p>}</div>
      <form onSubmit={submit} className="lakshya-ai-input"><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask Lakshya AI…" maxLength={4000} disabled={loading} /><button disabled={!message.trim() || loading}>↑</button></form>
    </section>}
  </>;
}
