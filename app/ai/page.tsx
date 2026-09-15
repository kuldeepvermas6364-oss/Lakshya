"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cleanAIText } from "@/lib/ai/format";

type Message = { id: number; role: "user" | "ai"; text: string; image?: string };

const prompts = [
  ["Explain", "Explain a difficult concept in simple language with an example."],
  ["Quiz me", "Create 5 JEE-level MCQs on a topic I choose. Ask me one at a time."],
  ["Revise", "Make a concise revision sheet for my next study session."],
  ["Plan", "Make a realistic study plan for today based on my priorities."],
] as const;

function InlineText({ text }: { text: string }) {
  const cleaned = cleanAIText(text);
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((part, i) => part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)}</>;
}

function RichAIResponse({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let list: { key: string; content: string }[] = [];
  const flush = () => { if (!list.length) return; nodes.push(<ul className="ai-rich-list" key={`list-${nodes.length}`}>{list.map((x) => <li key={x.key}><InlineText text={x.content} /></li>)}</ul>); list = []; };
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) { flush(); nodes.push(<div className="ai-rich-space" key={`space-${index}`} />); return; }
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) { flush(); nodes.push(<h3 className="ai-rich-heading" key={`h-${index}`}><InlineText text={heading[1]} /></h3>); return; }
    const bullet = line.match(/^[-•]\s+(.+)/);
    if (bullet) { list.push({ key: `${index}`, content: bullet[1] }); return; }
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    if (numbered) { flush(); nodes.push(<div className="ai-rich-number" key={`n-${index}`}><span>{line.match(/^\d+/)?.[0]}</span><InlineText text={numbered[1]} /></div>); return; }
    const option = line.match(/^([A-D])[.)]\s+(.+)/i);
    if (option) { flush(); nodes.push(<div className="ai-rich-option" key={`o-${index}`}><b>{option[1].toUpperCase()}</b><InlineText text={option[2]} /></div>); return; }
    const question = line.match(/^(\*\*)?(Q\d+[.:]?)(\*\*)?\s*(.+)/i);
    if (question) { flush(); nodes.push(<div className="ai-rich-question" key={`q-${index}`}><InlineText text={`${question[2]} ${question[4]}`} /></div>); return; }
    flush(); nodes.push(<p key={`p-${index}`}><InlineText text={line} /></p>);
  });
  flush();
  return <div className="ai-rich-response">{nodes}</div>;
}

export default function AIPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("General");
  const [error, setError] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imageName, setImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const context = useMemo(() => `Current study context: ${subject}. Keep explanations student-friendly and exam-oriented.`, [subject]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lakshya_pyq_ai_prompt");
      if (stored) { setInput(stored); localStorage.removeItem("lakshya_pyq_ai_prompt"); }
    } catch { /* localStorage can be unavailable in some browser modes */ }
  }, []);

  async function ask(text = input) {
    const value = text.trim() || (imageData ? "Analyze this image and explain what it shows. Solve any visible academic question step by step." : "");
    if (!value || loading) return;
    const id = Date.now();
    const attachedImage = imageData;
    setMessages((prev) => [...prev, { id, role: "user", text: value, image: attachedImage || undefined }]);
    setInput(""); setLoading(true); setError("");
    try {
      const endpoint = attachedImage ? "/api/ai/vision" : "/api/ai/chat";
      const body = attachedImage ? { message: value, image: attachedImage, mimeType: imageMime, context } : { message: value, context };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setMessages((prev) => [...prev, { id: id + 1, role: "ai", text: data.text || "No response was returned." }]);
      if (attachedImage) { setImageData(""); setImageName(""); setImageMime("image/jpeg"); }
    } catch (e) { setError(e instanceof Error ? e.message : "AI service is temporarily unavailable. Please try again."); }
    finally { setLoading(false); }
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
    <section className="ai-spotlight" style={{ marginTop: 0 }}><div className="ai-copy"><span className="ai-badge">✦ LAKSHYA AI · GEMINI</span><h1 style={{ fontSize: "clamp(38px,6vw,66px)", letterSpacing: "-.05em", lineHeight: 1, margin: "12px 0" }}>Your study copilot.</h1><p>Understand concepts, practise smarter, revise faster and build realistic study plans.</p></div><Link className="ai-cta" href="/">← Dashboard</Link></section>
    <section className="panel ai-workspace" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
      <div className="ai-workspace-head"><div><span className="section-eyebrow">STUDY CONTEXT</span><h2>What are you working on?</h2></div><label><span className="sr-only">Subject</span><select value={subject} onChange={(e) => setSubject(e.target.value)}><option>General</option><option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>English</option></select></label></div>
      <div className="ai-chips ai-prompt-row">
        {prompts.map(([label, prompt]) => <button key={label} className="secondary" onClick={() => void ask(prompt)} disabled={loading}>{label}</button>)}
        <Link href="/ai/image" className="create-image-chip"><span>✦</span> Create Image <b>→</b></Link>
      </div>
      <div className="ai-conversation" aria-live="polite">
        {messages.length === 0 && !loading ? <div className="ai-empty"><div className="ai-empty-icon">✦</div><h3>Ready when you are.</h3><p>Ask a question, paste a concept, upload a photo, or create a study image with Gemini Image AI.</p><Link href="/ai/image" className="ai-empty-image-link">✦ Create a study image</Link></div> : messages.map((message) => <article key={message.id} className={`ai-message ${message.role}`}><span className="ai-message-label">{message.role === "user" ? "YOU" : "LAKSHYA AI"}</span>{message.image && <img className="ai-user-image" src={message.image} alt="Uploaded study material" />}{message.role === "ai" ? <RichAIResponse text={message.text} /> : <p>{message.text}</p>}</article>)}
        {loading && <div className="ai-message ai"><span className="ai-message-label">LAKSHYA AI</span><div className="ai-thinking"><i></i><i></i><i></i><span>Looking at your question{imageData ? " and image" : ""}…</span></div></div>}
      </div>
      {error && <div className="ai-error" role="alert">{error} <button onClick={() => setError("")}>Dismiss</button></div>}
      <form onSubmit={submit} className="ai-composer">
        {imageData && <div className="ai-image-preview"><img src={imageData} alt="Selected study image" /><div><b>{imageName || "Study image"}</b><span>AI will read this image and answer your question.</span></div><button type="button" onClick={() => { setImageData(""); setImageName(""); }}>Remove</button></div>}
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={imageData ? "Ask something about this image…" : "Ask Lakshya AI about a topic, question, revision or study plan…"} rows={2} maxLength={4000} disabled={loading} />
        <div className="ai-composer-foot"><div className="ai-tools"><button type="button" className="image-button" onClick={() => fileRef.current?.click()} disabled={loading}>📷 Add photo</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) chooseImage(f); e.currentTarget.value = ""; }} /><Link href="/ai/image" className="composer-image-button">✦ Create Image</Link><span>{input.length}/4000 · {subject}</span></div><button className="primary" disabled={(!input.trim() && !imageData) || loading}>{loading ? "Thinking…" : imageData ? "Analyze Image →" : "Ask AI →"}</button></div>
      </form>
    </section>
    <p className="muted center" style={{ marginTop: 12 }}>AI can make mistakes. Verify important academic information with your textbook or teacher.</p>
    <style jsx>{`.ai-workspace-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px;border-bottom:1px solid rgba(109,93,252,.09)}.ai-workspace-head h2{margin:4px 0 0}.ai-workspace-head select{min-width:150px;padding:10px 12px;border:1px solid #e2e2ed;border-radius:11px;background:#fff;font-weight:700;color:#414357;outline:none}.ai-prompt-row{padding:14px 22px;border-bottom:1px solid rgba(109,93,252,.08);display:flex;gap:8px;flex-wrap:wrap}.create-image-chip{display:inline-flex;align-items:center;gap:7px;text-decoration:none;border:1px solid rgba(109,93,252,.22);background:linear-gradient(135deg,rgba(109,93,252,.1),rgba(217,70,239,.08));color:#5b4fe6;border-radius:10px;padding:10px 13px;font-size:10px;font-weight:900;transition:transform .2s,box-shadow .2s}.create-image-chip:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(109,93,252,.12)}.create-image-chip span{font-size:14px}.create-image-chip b{font-size:13px}.ai-conversation{min-height:380px;max-height:620px;overflow:auto;padding:22px;background:linear-gradient(180deg,rgba(250,249,255,.72),rgba(255,255,255,.45))}.ai-empty{text-align:center;max-width:480px;margin:85px auto}.ai-empty-icon{width:52px;height:52px;display:grid;place-items:center;margin:auto;border-radius:17px;background:linear-gradient(135deg,#6d5dfc,#d946ef);color:#fff;font-size:24px;box-shadow:0 12px 28px rgba(109,93,252,.25)}.ai-empty h3{margin:16px 0 5px;font-size:20px}.ai-empty p{margin:0;color:#858b9a;font-size:12px;line-height:1.7}.ai-empty-image-link{display:inline-flex;margin-top:14px;align-items:center;gap:6px;text-decoration:none;border-radius:999px;padding:9px 13px;background:#f3f0ff;color:#5b4fe6;font-size:10px;font-weight:900}.ai-message{max-width:82%;margin:0 0 18px;padding:14px 16px;border-radius:17px;background:#fff;border:1px solid #e9e8f1;box-shadow:0 8px 24px rgba(40,35,90,.05)}.ai-message.user{margin-left:auto;background:linear-gradient(135deg,rgba(109,93,252,.1),rgba(217,70,239,.06));border-color:rgba(109,93,252,.14)}.ai-message-label{display:block;font-size:8px;font-weight:900;letter-spacing:.13em;color:#888e9d;margin-bottom:7px}.ai-message p{white-space:pre-wrap;margin:0;font-size:12px;line-height:1.75;color:#292d3a}.ai-rich-response{font-size:12px;line-height:1.75;color:#292d3a}.ai-rich-response p{margin:7px 0;white-space:normal}.ai-rich-response strong{font-weight:900;color:#171827}.ai-rich-heading{font-size:15px;line-height:1.35;margin:15px 0 7px;color:#5b4fe6;font-weight:900}.ai-rich-list{margin:7px 0 10px;padding-left:21px}.ai-rich-list li{margin:5px 0}.ai-rich-number{display:flex;gap:9px;margin:7px 0}.ai-rich-number>span{font-weight:900;color:#6d5dfc;min-width:18px}.ai-rich-question{margin:14px 0 7px;padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,rgba(109,93,252,.08),rgba(217,70,239,.06));font-weight:900}.ai-rich-option{display:flex;align-items:flex-start;gap:10px;margin:5px 0;padding:7px 10px;border:1px solid #ececf3;border-radius:9px;background:#fff}.ai-rich-option b{min-width:20px;color:#6d5dfc}.ai-rich-space{height:3px}.ai-error{margin:0 22px 12px;padding:11px 13px;border-radius:11px;background:#fff2f2;color:#9a3e3e;font-size:11px}.ai-error button{float:right;border:0;background:none;text-decoration:underline}.ai-composer{padding:16px 22px;background:rgba(255,255,255,.92);border-top:1px solid rgba(109,93,252,.09)}.ai-composer textarea{width:100%;resize:vertical;box-sizing:border-box;border:1px solid #e1e0eb;border-radius:14px;padding:13px;font:inherit;font-size:12px;outline:none;background:#fbfbff;min-height:58px}.ai-composer textarea:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(109,93,252,.09)}.ai-composer-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:9px}.ai-tools{display:flex;align-items:center;gap:9px;min-width:0}.ai-tools span{font-size:9px;color:#8b92a1}.image-button,.composer-image-button{border:1px solid #e2e0ee;background:#fff;border-radius:10px;padding:9px 12px;font-weight:800;font-size:10px;cursor:pointer;text-decoration:none;color:#414357}.composer-image-button{border-color:rgba(109,93,252,.2);background:#f7f4ff;color:#5b4fe6}.image-button:disabled{opacity:.5;cursor:not-allowed}.ai-image-preview{display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px;border:1px solid #e4e2ef;border-radius:12px;background:#faf9ff}.ai-image-preview img{width:58px;height:58px;object-fit:cover;border-radius:9px}.ai-image-preview div{display:flex;flex:1;flex-direction:column;gap:3px;min-width:0}.ai-image-preview b{font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ai-image-preview span{font-size:9px;color:#858b9a}.ai-image-preview button{border:0;background:none;color:#a34a4a;font-size:9px;font-weight:800;cursor:pointer}.ai-user-image{display:block;max-width:280px;max-height:240px;object-fit:contain;border-radius:11px;margin:0 0 10px;border:1px solid #e5e3ef}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.ai-thinking{display:flex;align-items:center;gap:6px;color:#7f8391;font-size:10px}.ai-thinking i{width:6px;height:6px;border-radius:50%;background:#8b5cf6;animation:thinking 1s infinite ease-in-out}.ai-thinking i:nth-child(2){animation-delay:.15s}.ai-thinking i:nth-child(3){animation-delay:.3s}@keyframes thinking{0%,80%,100%{transform:scale(.7);opacity:.45}40%{transform:scale(1);opacity:1}}@media(max-width:700px){.ai-workspace-head{align-items:flex-start;flex-direction:column}.ai-workspace-head select{width:100%}.ai-conversation{min-height:360px;padding:14px}.ai-message{max-width:94%}.ai-composer,.ai-prompt-row{padding-left:14px;padding-right:14px}.ai-composer-foot{align-items:flex-end}.ai-composer-foot .primary{padding:10px 12px}.ai-tools{flex-wrap:wrap}.ai-image-preview{align-items:flex-start}}`}</style>
  </main>;
}
