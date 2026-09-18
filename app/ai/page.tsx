"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cleanAIText } from "@/lib/ai/format";

type Message = { id: number; role: "user" | "ai"; text: string; image?: string };\ntype PlanTask = { title: string; subjectId: string; date: string; time: string; durationMinutes: number };\ntype PendingPlan = { planTitle: string; summary: string; questions: string[]; tasks: PlanTask[] };

const prompts = [
  ["Explain", "Explain a difficult concept in simple language with an example."],
  ["Quiz me", "Create 5 JEE-level MCQs on a topic I choose. Ask me one at a time."],
  ["Revise", "Make a concise revision sheet for my next study session."],
  ["Plan", "Make a realistic study plan for today based on my priorities."],
] as const;

function InlineText({ text }: { text: string }) {
  const cleaned = cleanAIText(text);
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return <>{parts.map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="ai-source-link">{link[1]} ↗</a>;
    return part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>;
  })}</>;
}

type AISource = { title: string; url: string };

function splitAISources(text: string) {
  // Accept both the new structured source block and older AI output formats.
  const marker = text.match(/(?:^|\n)\s*#{0,3}\s*Sources\s*:?\s*\n/i);
  if (!marker || marker.index === undefined) return { answer: text, sources: [] as AISource[] };

  const answer = text.slice(0, marker.index).trim();
  const sourceLines = text.slice(marker.index + marker[0].length)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sources: AISource[] = [];
  const seen = new Set<string>();
  for (const line of sourceLines) {
    const match = line.match(/^(?:\d+[\s.)-]*)?\s*(.*?)\s*(?:—|–|-|:)\s*(https?:\/\/\S+)$/);
    const rawUrl = line.match(/https?:\/\/\S+/)?.[0];
    const url = (match?.[2] || rawUrl || "").replace(/[),.;]+$/, "");
    if (!url || seen.has(url)) continue;
    const title = (match?.[1] || line.replace(/https?:\/\/\S+.*$/, "")).replace(/^\d+[\s.)-]*/, "").trim() || sourceDomain(url);
    seen.add(url);
    sources.push({ title, url });
  }
  return { answer, sources: sources.slice(0, 8) };
}

function sourceDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Web source"; }
}

function AIResponseContent({ text }: { text: string }) {
  const { answer, sources } = splitAISources(text);
  return <>
    <RichAIResponse text={answer} />
    {sources.length > 0 && (
      <section className="ai-sources" aria-label="Sources">
        <div className="ai-sources-head">
          <span className="ai-sources-spark">✦</span>
          <b>Sources</b>
          <span>{sources.length}</span>
        </div>
        <div className="ai-source-grid">
          {sources.map((source, index) => (
            <a key={source.url} className="ai-source-card" href={source.url} target="_blank" rel="noreferrer">
              <span className="ai-source-favicon">{sourceDomain(source.url).slice(0, 1).toUpperCase()}</span>
              <span className="ai-source-copy">
                <b>{source.title}</b>
                <small>{sourceDomain(source.url)}</small>
              </span>
              <span className="ai-source-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>
    )}
  </>;
}

function RichAIResponse({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let list: { key: string; content: string }[] = [];
  const flush = () => {
    if (!list.length) return;
    nodes.push(<ul className="ai-rich-list" key={`list-${nodes.length}`}>{list.map((x) => <li key={x.key}><InlineText text={x.content} /></li>)}</ul>);
    list = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) { flush(); return; }

    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) { flush(); nodes.push(<h3 className="ai-rich-heading" key={`h-${index}`}><span>✦</span><InlineText text={heading[1]} /></h3>); return; }

    const bullet = line.match(/^[-•*]\s+(.+)/);
    if (bullet) { list.push({ key: `${index}`, content: bullet[1] }); return; }

    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    if (numbered) { flush(); nodes.push(<div className="ai-rich-number" key={`n-${index}`}><span>{line.match(/^\d+/)?.[0]}</span><InlineText text={numbered[1]} /></div>); return; }

    const option = line.match(/^([A-D])[.)]\s+(.+)/i);
    if (option) { flush(); nodes.push(<div className="ai-rich-option" key={`o-${index}`}><b>{option[1].toUpperCase()}</b><InlineText text={option[2]} /></div>); return; }

    const question = line.match(/^(\*\*)?(Q\d+[.:]?)(\*\*)?\s*(.+)/i);
    if (question) { flush(); nodes.push(<div className="ai-rich-question" key={`q-${index}`}><InlineText text={`${question[2]} ${question[4]}`} /></div>); return; }

    flush();
    nodes.push(<p key={`p-${index}`}><InlineText text={line} /></p>);
  });

  flush();
  return <div className="ai-rich-response">{nodes}</div>;
}

export default function AIPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [subject, setSubject] = useState("General");
  const [error, setError] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imageName, setImageName] = useState("");\n  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);\n  const [planSaving, setPlanSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const context = useMemo(() => `Current study context: ${subject}. Keep explanations student-friendly and exam-oriented.`, [subject]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lakshya_pyq_ai_prompt");
      if (stored) { setInput(stored); localStorage.removeItem("lakshya_pyq_ai_prompt"); }
    } catch { /* localStorage can be unavailable in some browser modes */ }
  }, []);

  function isPlanRequest(value: string) {
    return /\\b(plan|planner|schedule|timetable|routine|study plan|schedule me|set.*plan|plan.*set)\\b/i.test(value)
      || /(plan|planner|schedule|routine|timetable|प्लान|शेड्यूल|रूटीन|समय.*तालिका|बना दो|सेट कर)/i.test(value);
  }

  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function confirmPlan() {
    if (!pendingPlan || !pendingPlan.tasks.length || planSaving) return;
    setPlanSaving(true); setError("");
    try {
      const { auth } = await import("@/lib/firebase");
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in to save your study plan.");
      const { savePlannerTask } = await import("@/lib/study-storage");
      for (const task of pendingPlan.tasks) {
        await savePlannerTask(user.uid, {
          title: task.title,
          subjectId: task.subjectId,
          date: task.date,
          time: task.time,
          durationMinutes: task.durationMinutes,
          completed: false,
        });
      }
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "ai",
        text: `## Plan set successfully
${pendingPlan.summary}

I've added ${pendingPlan.tasks.length} study sessions to your Lakshya planner.`,
      }]);
      setPendingPlan(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the plan.");
    } finally {
      setPlanSaving(false);
    }
  }

  async function ask(text = input) {
    const value = text.trim() || (imageData ? "Analyze this image and explain what it shows. Solve any visible academic question step by step." : "");
    if (!value || loading) return;
    const id = Date.now();
    const aiId = id + 1;
    const attachedImage = imageData;
    setMessages((prev) => [...prev, { id, role: "user", text: value, image: attachedImage || undefined }]);
    setInput(""); setLoading(true); setError("");

    try {
      if (!attachedImage && isPlanRequest(value)) {
        const res = await fetch("/api/ai/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, context, today: localToday() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not build the study plan.");
        if (data.ready) {
          const plan: PendingPlan = {
            planTitle: String(data.planTitle || "Your study plan"),
            summary: String(data.summary || "Your schedule is ready to review."),
            questions: Array.isArray(data.questions) ? data.questions.map(String) : [],
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
          };
          setPendingPlan(plan);
          setMessages(prev => [...prev, {
            id: aiId,
            role: "ai",
            text: `## ${plan.planTitle}
${plan.summary}

**${plan.tasks.length} sessions** are ready. Review them below, then tap **Set this plan** to save them to your Lakshya planner.`,
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: aiId,
            role: "ai",
            text: `## I need a little more information
${(Array.isArray(data.questions) ? data.questions : ["Tell me your available study time and target dates."]).map((q: unknown) => "- " + String(q)).join("\\n")}`,
          }]);
        }
        return;
      }

      if (attachedImage) {
        const res = await fetch("/api/ai/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, image: attachedImage, mimeType: imageMime, context }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI request failed");
        setMessages((prev) => [...prev, { id: aiId, role: "ai", text: data.text || "No response was returned." }]);
        setImageData(""); setImageName(""); setImageMime("image/jpeg");
        return;
      }

      // Text chat is streamed so the first generated tokens appear immediately.
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({ message: value, context, stream: true }),
      });
      if (!res.ok) {
        let message = "AI request failed";
        try { const data = await res.json(); message = data.error || message; } catch { /* non-JSON error */ }
        throw new Error(message);
      }
      if (!res.body) throw new Error("AI stream was not available. Please try again.");

      setStreamingId(aiId);
      setMessages((prev) => [...prev, { id: aiId, role: "ai", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      try {
        while (true) {
          const { value: chunk, done } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(chunk, { stream: true });
          setMessages((prev) => prev.map((message) => message.id === aiId ? { ...message, text: accumulated } : message));
        }
        accumulated += decoder.decode();
        if (accumulated) {
          setMessages((prev) => prev.map((message) => message.id === aiId ? { ...message, text: accumulated } : message));
        }
      } finally {
        reader.releaseLock();
      }

      if (!accumulated.trim()) throw new Error("AI returned an empty response. Please try again.");
    } catch (e) {
      setMessages((prev) => prev.filter((message) => !(message.id === aiId && message.role === "ai" && !message.text)));
      setError(e instanceof Error ? e.message : "AI service is temporarily unavailable. Please try again.");
    } finally {
      setStreamingId(null);
      setLoading(false);
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(); }

  function chooseImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 9 * 1024 * 1024) { setError("Image is too large. Please choose an image under 9 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageData(String(reader.result)); setImageMime(file.type); setImageName(file.name); setError(""); };
    reader.onerror = () => setError("Could not read that image. Please try another one.");
    reader.readAsDataURL(file);
  }

  return <main className="page lakshya-ai-page">
    <section className="ai-spotlight" style={{ marginTop: 0 }}><div className="ai-copy"><span className="ai-badge">✦ LAKSHYA AI</span><h1 style={{ fontSize: "clamp(38px,6vw,66px)", letterSpacing: "-.05em", lineHeight: 1, margin: "12px 0" }}>Your study copilot.</h1><p>Understand concepts, practise smarter, revise faster and build realistic study plans.</p></div><Link className="ai-cta" href="/">← Dashboard</Link></section>
    <section className="panel ai-workspace" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
      <div className="ai-workspace-head"><div><span className="section-eyebrow">STUDY CONTEXT</span><h2>What are you working on?</h2></div><label><span className="sr-only">Subject</span><select value={subject} onChange={(e) => setSubject(e.target.value)}><option>General</option><option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>English</option></select></label></div>
      <div className="ai-chips ai-prompt-row">
        {prompts.map(([label, prompt]) => <button key={label} className="secondary" onClick={() => void ask(prompt)} disabled={loading}>{label}</button>)}
        <Link href="/ai/image" className="create-image-chip"><span>✦</span> Create Image <b>→</b></Link>
      </div>
      <div className="ai-conversation" aria-live="polite">
        {messages.length === 0 && !loading ? <div className="ai-empty"><div className="ai-empty-icon">✦</div><h3>Ready when you are.</h3><p>Ask a question, paste a concept, upload a photo, or create a study image.</p><Link href="/ai/image" className="ai-empty-image-link">✦ Create a study image</Link></div> : messages.map((message) => <article key={message.id} className={`ai-message ${message.role}`}><span className="ai-message-label">{message.role === "user" ? "YOU" : "LAKSHYA AI"}</span>{message.image && <img className="ai-user-image" src={message.image} alt="Uploaded study material" />}{message.role === "ai" ? <AIResponseContent text={message.text} /> : <p>{message.text}</p>}</article>)}
        {loading && streamingId === null && <div className="ai-message ai"><span className="ai-message-label">LAKSHYA AI</span><div className="ai-thinking"><span className="ai-gemini-orb"><span>✦</span></span><div><b>Lakshya AI is thinking</b><small>Analyzing your question{imageData ? " and image" : ""}…</small></div><span className="ai-thinking-dots"><i></i><i></i><i></i></span></div></div>}
      </div>
      {pendingPlan && pendingPlan.tasks.length > 0 && (
        <section className="ai-plan-card" aria-label="AI generated study plan">
          <div className="ai-plan-head">
            <div><span className="section-eyebrow">READY TO SAVE</span><h3>{pendingPlan.planTitle}</h3></div>
            <span className="ai-plan-count">{pendingPlan.tasks.length} sessions</span>
          </div>
          <p className="ai-plan-summary">{pendingPlan.summary}</p>
          <div className="ai-plan-list">
            {pendingPlan.tasks.slice(0, 12).map((task, index) => (
              <div className="ai-plan-row" key={`${task.date}-${task.time}-${index}`}>
                <span>{task.date}</span><b>{task.time}</b><strong>{task.title}</strong><small>{task.durationMinutes}m · {task.subjectId}</small>
              </div>
            ))}
            {pendingPlan.tasks.length > 12 && <small className="ai-plan-more">+ {pendingPlan.tasks.length - 12} more sessions</small>}
          </div>
          <div className="ai-plan-actions">
            <button className="primary" onClick={() => void confirmPlan()} disabled={planSaving}>{planSaving ? "Saving plan…" : "✓ Set this plan"}</button>
            <button className="secondary" onClick={() => setPendingPlan(null)} disabled={planSaving}>Not now</button>
          </div>
        </section>
      )}
      {error && <div className="ai-error" role="alert">{error} <button onClick={() => setError("")}>Dismiss</button></div>}
      <form onSubmit={submit} className="ai-composer">
        {imageData && <div className="ai-image-preview"><img src={imageData} alt="Selected study image" /><div><b>{imageName || "Study image"}</b><span>AI will read this image and answer your question.</span></div><button type="button" onClick={() => { setImageData(""); setImageName(""); }}>Remove</button></div>}
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={imageData ? "Ask something about this image…" : "Ask Lakshya AI about a topic, question, revision or study plan…"} rows={2} maxLength={4000} disabled={loading} />
        <div className="ai-composer-foot"><div className="ai-tools"><button type="button" className="image-button" onClick={() => fileRef.current?.click()} disabled={loading}>📷 Add photo</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) chooseImage(f); e.currentTarget.value = ""; }} /><Link href="/ai/image" className="composer-image-button">✦ Create Image</Link><span>{input.length}/4000 · {subject}</span></div><button className="primary" disabled={(!input.trim() && !imageData) || loading}>{loading ? "Thinking…" : imageData ? "Analyze Image →" : "Ask AI →"}</button></div>
      </form>
    </section>
    <p className="muted center" style={{ marginTop: 12 }}>AI can make mistakes. Verify important academic information with your textbook or teacher.</p>
    <style jsx>{`
  .lakshya-ai-page{
    --ai-ink:#202124;--ai-muted:#656a79;--ai-line:rgba(116,92,210,.16);--ai-soft:#f7f4ff;
    position:relative;width:100vw;max-width:none!important;min-height:100dvh;
    margin-left:calc(50% - 50vw);padding:0 0 34px!important;overflow:hidden;
    background:
      radial-gradient(circle at 8% 8%,rgba(117,92,255,.34),transparent 25%),
      radial-gradient(circle at 92% 7%,rgba(236,72,153,.28),transparent 24%),
      radial-gradient(circle at 80% 58%,rgba(34,211,238,.20),transparent 28%),
      radial-gradient(circle at 12% 76%,rgba(251,191,36,.18),transparent 25%),
      linear-gradient(135deg,#f5f1ff 0%,#eef5ff 32%,#fff0fa 64%,#eefdfb 100%);
    background-size:120% 120%;
    animation:aiBackgroundShift 18s ease-in-out infinite alternate;
  }
  .lakshya-ai-page:before,.lakshya-ai-page:after{
    content:"";position:absolute;width:440px;height:440px;border-radius:50%;filter:blur(80px);
    pointer-events:none;opacity:.42;z-index:0;
  }
  .lakshya-ai-page:before{
    left:-190px;top:8%;background:linear-gradient(135deg,rgba(99,91,255,.35),rgba(56,189,248,.18));
    animation:aiFloat1 9s ease-in-out infinite alternate;
  }
  .lakshya-ai-page:after{
    right:-190px;top:48%;background:linear-gradient(135deg,rgba(236,72,153,.28),rgba(168,85,247,.24));
    animation:aiFloat2 11s ease-in-out infinite alternate;
  }
  .lakshya-ai-page::marker{display:none}
  .lakshya-ai-page>*{position:relative;z-index:1}

  .ai-spotlight{
    max-width:900px!important;margin:0 auto!important;padding:24px 20px 10px!important;
    display:flex;align-items:center;justify-content:space-between;gap:18px;background:transparent!important;
  }
  .ai-copy{min-width:0}.ai-badge{
    display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;
    background:rgba(116,92,255,.08);border:1px solid rgba(116,92,255,.12);color:#6552dc;
    font-size:9px;font-weight:900;letter-spacing:.08em;
  }
  .ai-copy h1{font-size:clamp(30px,5vw,46px)!important;line-height:1.05!important;margin:10px 0 6px!important;letter-spacing:-.045em!important;color:#18191f}
  .ai-copy p{margin:0;color:var(--ai-muted);font-size:12px;line-height:1.6}
  .ai-cta{border:1px solid var(--ai-line);background:rgba(255,255,255,.75);color:#363842;text-decoration:none;padding:9px 12px;border-radius:12px;font-size:10px;font-weight:850;transition:.2s}
  .ai-cta:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(45,40,90,.08)}

  .ai-workspace{
    max-width:900px!important;margin:12px auto 0!important;border:0!important;border-radius:24px!important;
    box-shadow:0 22px 70px rgba(44,37,92,.09)!important;background:rgba(255,255,255,.82)!important;
    backdrop-filter:blur(20px);overflow:hidden!important;
  }
  .ai-workspace-head{
    display:flex;justify-content:space-between;align-items:center;gap:14px;padding:17px 20px;
    border-bottom:1px solid rgba(100,90,160,.08);
  }
  .section-eyebrow{font-size:8px;letter-spacing:.14em;font-weight:900;color:#8b8794}
  .ai-workspace-head h2{margin:3px 0 0;font-size:15px;color:#262733}
  .ai-workspace-head select{min-width:130px;padding:8px 11px;border:1px solid #e5e4eb;border-radius:10px;background:#fff;font-weight:750;color:#444650;outline:none;font-size:10px}

  .ai-prompt-row{padding:11px 20px;border-bottom:1px solid rgba(100,90,160,.08);display:flex;gap:7px;flex-wrap:wrap}
  .ai-prompt-row .secondary,.create-image-chip{
    border:1px solid #e7e5ed;background:#fff;color:#454651;border-radius:999px;padding:8px 11px;
    font-size:9px;font-weight:850;cursor:pointer;text-decoration:none;transition:transform .2s,box-shadow .2s,border-color .2s;
  }
  .ai-prompt-row .secondary:hover,.create-image-chip:hover{transform:translateY(-2px);border-color:#d3cdf5;box-shadow:0 7px 18px rgba(75,60,140,.08)}
  .create-image-chip{color:#614fe0;background:linear-gradient(135deg,#faf8ff,#fff7fc);border-color:#ddd6fb}

  .ai-conversation{
    min-height:430px;max-height:62dvh;overflow:auto;padding:24px 24px 18px;
    background:linear-gradient(180deg,rgba(250,249,255,.55),rgba(255,255,255,.25));scroll-behavior:smooth;
  }
  .ai-empty{text-align:center;max-width:470px;margin:72px auto 80px}
  .ai-empty-icon{
    width:58px;height:58px;display:grid;place-items:center;margin:auto;border-radius:20px;
    color:#fff;font-size:25px;background:linear-gradient(135deg,#705cf5,#e04db2);
    box-shadow:0 14px 34px rgba(105,82,230,.25);animation:geminiGlow 2.2s ease-in-out infinite;
  }
  .ai-empty h3{margin:16px 0 5px;font-size:19px;color:#292a33}.ai-empty p{margin:0;color:#858995;font-size:11px;line-height:1.7}
  .ai-empty-image-link{display:inline-flex;margin-top:14px;padding:9px 13px;border-radius:999px;background:#f5f2ff;color:#604fe0;text-decoration:none;font-size:9px;font-weight:900}

  .ai-message{max-width:790px;margin:0 auto 24px;animation:messageIn .34s cubic-bezier(.2,.8,.2,1) both}
  .ai-message.user{display:flex;justify-content:flex-end}
  .ai-message.user>p{
    max-width:min(76%,580px);margin:0;padding:11px 14px;border-radius:19px 19px 6px 19px;
    background:linear-gradient(135deg,#735df4,#8d70f6);color:#fff;font-size:12px;line-height:1.6;
    box-shadow:0 9px 25px rgba(105,82,230,.18);white-space:pre-wrap;
  }
  .ai-message.ai{padding:0 4px}
  .ai-message-label{
    display:flex;align-items:center;gap:7px;font-size:8px;font-weight:900;letter-spacing:.11em;color:#777b87;margin:0 0 9px;
  }
  .ai-message.ai .ai-message-label:before{
    content:"✦";width:22px;height:22px;display:grid;place-items:center;border-radius:8px;
    color:#fff;background:linear-gradient(135deg,#735df4,#d94fb8);font-size:11px;box-shadow:0 5px 15px rgba(108,80,225,.18);
  }
  .ai-rich-response{font-size:12px;line-height:1.8;color:#292c35;max-width:760px}
  .ai-rich-response p{margin:8px 0;white-space:normal}.ai-rich-response strong{font-weight:900;color:#171820}
  .ai-rich-heading{display:flex;align-items:center;gap:7px;font-size:15px;line-height:1.35;margin:18px 0 7px;color:#302b55;font-weight:900}
  .ai-rich-heading span{font-size:10px;color:#765cf3}.ai-rich-list{margin:7px 0 11px;padding-left:21px}.ai-rich-list li{margin:5px 0}
  .ai-rich-number{display:flex;gap:9px;margin:8px 0}.ai-rich-number>span{font-weight:900;color:#735df4;min-width:18px}
  .ai-rich-question{margin:14px 0 7px;padding:11px 13px;border-radius:12px;background:#f7f4ff;border:1px solid #e8e1ff;font-weight:900}
  .ai-rich-option{display:flex;align-items:flex-start;gap:10px;margin:5px 0;padding:8px 10px;border:1px solid #ecebf0;border-radius:10px;background:rgba(255,255,255,.8)}
  .ai-rich-option b{min-width:20px;color:#735df4}.ai-source-link{color:#624fe2;font-weight:800;text-decoration:none}.ai-source-link:hover{text-decoration:underline}

  .ai-sources{margin-top:18px;padding-top:13px;border-top:1px solid #eceaf1}
  .ai-sources-head{display:flex;align-items:center;gap:7px;margin-bottom:9px;color:#353641;font-size:11px}
  .ai-sources-head b{font-size:11px}.ai-sources-head>span:last-child{font-size:8px;color:#8b8d97;background:#f2f0f7;border-radius:999px;padding:3px 7px}
  .ai-sources-spark{color:#765cf3;font-size:10px}
  .ai-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  .ai-source-card{
    display:flex;align-items:center;gap:9px;min-width:0;padding:9px 10px;border:1px solid #e9e7ee;
    border-radius:12px;background:rgba(255,255,255,.82);text-decoration:none;transition:.2s;
  }
  .ai-source-card:hover{transform:translateY(-2px);border-color:#d7cff7;box-shadow:0 8px 20px rgba(70,55,130,.07)}
  .ai-source-favicon{width:24px;height:24px;flex:0 0 24px;display:grid;place-items:center;border-radius:8px;background:#f0edff;color:#6652db;font-size:9px;font-weight:900}
  .ai-source-copy{display:block;min-width:0;flex:1}.ai-source-copy b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;color:#3c3c46}
  .ai-source-copy small{display:block;margin-top:2px;font-size:8px;color:#9697a0}.ai-source-arrow{font-size:11px;color:#8b8796}

  .ai-thinking{
    display:flex;align-items:center;gap:10px;width:max-content;max-width:100%;padding:8px 0;
    animation:thinkingIn .25s ease both;
  }
  .ai-gemini-orb{
    width:38px;height:38px;display:grid;place-items:center;flex:0 0 38px;border-radius:14px;
    background:linear-gradient(135deg,#705cf5,#e04db2);color:#fff;font-size:18px;
    box-shadow:0 8px 28px rgba(108,80,225,.25);animation:geminiPulse 1.6s ease-in-out infinite;
  }
  .ai-gemini-orb span{animation:geminiSpark 1.15s ease-in-out infinite}.ai-thinking>div{display:flex;flex-direction:column;gap:2px}
  .ai-thinking b{font-size:10px;color:#464650}.ai-thinking small{font-size:9px;color:#92949e}
  .ai-thinking-dots{display:flex;gap:3px;margin-left:3px}.ai-thinking-dots i{width:4px;height:4px;border-radius:50%;background:#765cf3;animation:thinkingDot 1s ease-in-out infinite}
  .ai-thinking-dots i:nth-child(2){animation-delay:.15s}.ai-thinking-dots i:nth-child(3){animation-delay:.3s}

  .ai-plan-card{margin:0 20px 14px;padding:14px;border:1px solid #ddd6fb;border-radius:16px;background:linear-gradient(135deg,rgba(249,247,255,.96),rgba(255,248,253,.96));box-shadow:0 10px 28px rgba(80,60,150,.08)}
  .ai-plan-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.ai-plan-head h3{margin:3px 0 0;font-size:14px;color:#302b55}.ai-plan-count{font-size:8px;font-weight:900;padding:5px 8px;border-radius:999px;background:#eee9ff;color:#6855db}
  .ai-plan-summary{margin:8px 0;color:#626574;font-size:10px;line-height:1.55}.ai-plan-list{display:flex;flex-direction:column;gap:5px;max-height:250px;overflow:auto}
  .ai-plan-row{display:grid;grid-template-columns:82px 48px minmax(0,1fr) auto;align-items:center;gap:7px;padding:8px 9px;border:1px solid #ece8f6;border-radius:10px;background:rgba(255,255,255,.78);font-size:9px}
  .ai-plan-row span,.ai-plan-row b{color:#756f82;font-size:8px}.ai-plan-row strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#373543}.ai-plan-row small{color:#8b8c97;font-size:8px}.ai-plan-more{padding:4px 2px;color:#777b88;font-size:8px}
  .ai-plan-actions{display:flex;gap:7px;margin-top:10px}.ai-plan-actions .primary,.ai-plan-actions .secondary{font-size:9px}
  .ai-error{margin:0 20px 12px;padding:10px 12px;border-radius:11px;background:#fff2f2;color:#9a3e3e;font-size:10px}
  .ai-error button{float:right;border:0;background:none;text-decoration:underline}
  .ai-composer{
    padding:13px 16px;background:rgba(255,255,255,.94);border-top:1px solid rgba(100,90,160,.09);
    box-shadow:0 -10px 30px rgba(45,38,100,.045);transition:box-shadow .25s;
  }
  .ai-composer:focus-within{box-shadow:0 -12px 38px rgba(76,58,150,.10)}
  .ai-composer textarea{
    width:100%;box-sizing:border-box;resize:none;border:0;outline:none;background:#f7f7fa;border-radius:17px;
    padding:12px 14px;min-height:54px;font:inherit;font-size:12px;color:#252630;line-height:1.55;
  }
  .ai-composer textarea:focus{background:#f5f3fc}.ai-composer-foot{display:flex;justify-content:space-between;align-items:center;gap:9px;margin-top:8px}
  .ai-tools{display:flex;align-items:center;gap:6px;min-width:0}.image-button,.composer-image-button{
    border:1px solid #e6e4ec;background:#fff;border-radius:999px;padding:7px 9px;font-weight:800;font-size:9px;
    cursor:pointer;text-decoration:none;color:#555764;transition:.2s
  }
  .composer-image-button{color:#624fe2;background:#f7f4ff;border-color:#e2dbfc}.image-button:hover,.composer-image-button:hover{transform:translateY(-1px)}
  .ai-tools span{font-size:8px;color:#9a9ba4}.primary{
    border:0;border-radius:999px;padding:9px 13px;background:linear-gradient(135deg,#705cf5,#d94fb8);color:#fff;
    font-size:9px;font-weight:900;cursor:pointer;box-shadow:0 7px 18px rgba(105,80,225,.18);transition:.2s
  }
  .primary:hover{transform:translateY(-1px)}.primary:disabled{opacity:.55;cursor:not-allowed;transform:none}
  .ai-image-preview{display:flex;align-items:center;gap:9px;margin-bottom:9px;padding:7px;border:1px solid #e5e2ed;border-radius:12px;background:#faf9ff}
  .ai-image-preview img{width:48px;height:48px;object-fit:cover;border-radius:8px}.ai-image-preview div{display:flex;flex:1;flex-direction:column;gap:2px;min-width:0}
  .ai-image-preview b{font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ai-image-preview span{font-size:8px;color:#858895}
  .ai-image-preview button{border:0;background:none;color:#a34a4a;font-size:8px;font-weight:800;cursor:pointer}
  .ai-user-image{display:block;max-width:300px;max-height:260px;object-fit:contain;border-radius:13px;margin:0 0 10px;border:1px solid #e5e3ef}
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

  @keyframes aiBackgroundShift{from{background-position:0% 0%}to{background-position:100% 100%}}
  @keyframes aiFloat1{from{transform:translate3d(0,0,0) scale(.85)}to{transform:translate3d(70px,50px,0) scale(1.12)}}
  @keyframes aiFloat2{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(-60px,-55px,0) scale(.82)}}
  @keyframes messageIn{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:none}}
  @keyframes thinkingIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  @keyframes geminiPulse{0%,100%{transform:scale(.94);box-shadow:0 8px 25px rgba(108,80,225,.20)}50%{transform:scale(1.06);box-shadow:0 13px 35px rgba(217,79,184,.28)}}
  @keyframes geminiSpark{0%,100%{transform:rotate(-10deg) scale(.88)}50%{transform:rotate(12deg) scale(1.14)}}
  @keyframes geminiGlow{0%,100%{transform:translateY(0);box-shadow:0 14px 34px rgba(105,82,230,.20)}50%{transform:translateY(-3px);box-shadow:0 18px 42px rgba(217,79,184,.25)}}
  @keyframes thinkingDot{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}

  @media(max-width:700px){
    .lakshya-ai-page{padding-bottom:84px!important}
    .ai-spotlight{padding:15px 13px 9px!important}.ai-spotlight .ai-cta{display:none}
    .ai-copy h1{font-size:30px!important}.ai-copy p{font-size:10px}
    .ai-workspace{margin:0!important;border-radius:0!important;box-shadow:none!important;background:rgba(255,255,255,.72)!important}
    .ai-workspace-head{padding:14px}.ai-workspace-head select{width:100%}.ai-prompt-row{padding:9px 12px;flex-wrap:nowrap;overflow:auto}
    .ai-prompt-row>*{flex:0 0 auto}.ai-conversation{min-height:calc(100dvh - 315px);max-height:none;padding:18px 13px 16px}
    .ai-message{max-width:100%;margin-bottom:20px}.ai-message.user>p{max-width:84%;font-size:11px}
    .ai-rich-response{font-size:11px;line-height:1.75}.ai-source-grid{grid-template-columns:1fr}
    .ai-composer{position:sticky;bottom:0;z-index:4;padding:10px}.ai-composer-foot{align-items:flex-end}
    .ai-tools{flex-wrap:wrap}.ai-tools span{display:none}.ai-composer .primary{padding:9px 11px}
    .ai-plan-card{margin:0 10px 12px}.ai-plan-row{grid-template-columns:68px 42px minmax(0,1fr)}.ai-plan-row small{grid-column:3}.ai-plan-actions{flex-wrap:wrap}

    .ai-image-preview{align-items:flex-start}
  }
  @media(prefers-reduced-motion:reduce){
    .lakshya-ai-page:before,.lakshya-ai-page:after,.ai-message,.ai-gemini-orb,.ai-empty-icon,.ai-gemini-orb span,.ai-thinking-dots i{animation:none}
    .ai-conversation{scroll-behavior:auto}
  }
`}</style>
  </main>;
}
