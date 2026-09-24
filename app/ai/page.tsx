"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cleanAIText } from "@/lib/ai/format";

type Message = { id: number; role: "user" | "ai"; text: string; image?: string };
type AISource = { title: string; url: string };

function getPreferredLanguage() {
  if (typeof window === "undefined") return "hi-en";
  const direct = localStorage.getItem("lakshya_ai_language");
  if (direct) return direct;
  try { return JSON.parse(localStorage.getItem("lakshya_settings") || "{}").language || "hi-en"; } catch { return "hi-en"; }
}

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

function sourceDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Web source"; }
}

function splitAISources(text: string) {
  const marker = text.match(/(?:^|\n)\s*#{0,3}\s*Sources\s*:?\s*\n/i);
  if (!marker || marker.index === undefined) return { answer: text, sources: [] as AISource[] };
  const answer = text.slice(0, marker.index).trim();
  const sourceLines = text.slice(marker.index + marker[0].length).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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

function RichAIResponse({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const nodes: ReactNode[] = [];
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

function AIResponseContent({ text }: { text: string }) {
  const { answer, sources } = splitAISources(text);
  return <>
    <RichAIResponse text={answer} />
    {sources.length > 0 && (
      <section className="ai-sources" aria-label="Sources">
        <div className="ai-sources-head"><span>✦</span><b>Sources</b><em>{sources.length}</em></div>
        <div className="ai-source-grid">
          {sources.map((source) => (
            <a key={source.url} className="ai-source-card" href={source.url} target="_blank" rel="noreferrer">
              <span className="ai-source-favicon">{sourceDomain(source.url).slice(0, 1).toUpperCase()}</span>
              <span className="ai-source-copy"><b>{source.title}</b><small>{sourceDomain(source.url)}</small></span>
              <span>↗</span>
            </a>
          ))}
        </div>
      </section>
    )}
  </>;
}

export default function AIPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<number | null>(null);
  const [subject, setSubject] = useState("General");
  const [error, setError] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatId, setChatId] = useState(() => `chat-${Date.now()}`);
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string; updatedAt: number }[]>([]);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [imageData, setImageData] = useState("");
  const [imageMime, setImageMime] = useState("image/jpeg");
  const [imageName, setImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const context = useMemo(() => `Current study context: ${subject}. Keep explanations student-friendly and exam-oriented.`, [subject]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lakshya_pyq_ai_prompt");
      if (stored) { setInput(stored); localStorage.removeItem("lakshya_pyq_ai_prompt"); }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lakshya_ai_history");
      if (raw) setChatHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const el = conversationRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    if (!messages.length) return;
    const firstUser = messages.find((m) => m.role === "user");
    const title = firstUser?.text?.slice(0, 42) || "New study chat";
    setChatHistory((prev) => {
      const next = [{ id: chatId, title, updatedAt: Date.now() }, ...prev.filter((item) => item.id !== chatId)].slice(0, 30);
      try { localStorage.setItem("lakshya_ai_history", JSON.stringify(next)); } catch {}
      return next;
    });
  }, [messages, loading, chatId]);

  function startNewChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setImageData("");
    setImageName("");
    setError("");
    setShowHistory(false);
    setChatId(`chat-${Date.now()}`);
  }

  function openHistory(id: string) {
    try {
      const saved = localStorage.getItem(`lakshya_ai_chat_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed.messages || []);
        setSubject(parsed.subject || "General");
        setChatId(id);
        setShowHistory(false);
      }
    } catch {}
  }

  useEffect(() => {
    if (!messages.length) return;
    try {
      localStorage.setItem(`lakshya_ai_chat_${chatId}`, JSON.stringify({ messages, subject }));
    } catch {}
  }, [messages, subject, chatId]);

  async function ask(text = input) {
    const value = text.trim() || (imageData ? "Analyze this image and explain what it shows. Solve any visible academic question step by step." : "");
    if (!value || loading) return;
    const id = Date.now();
    const aiId = id + 1;
    const attachedImage = imageData;
    setMessages((prev) => [...prev, { id, role: "user", text: value, image: attachedImage || undefined }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      if (attachedImage) {
        const res = await fetch("/api/ai/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, image: attachedImage, mimeType: imageMime, context, language: getPreferredLanguage() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI request failed");
        setMessages((prev) => [...prev, { id: aiId, role: "ai", text: data.text || "No response was returned." }]);
        setImageData(""); setImageName(""); setImageMime("image/jpeg");
        return;
      }

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({ message: value, context, language: getPreferredLanguage(), stream: true }),
      });
      if (!res.ok) {
        let message = "AI request failed";
        try { const data = await res.json(); message = data.error || message; } catch {}
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
        if (accumulated) setMessages((prev) => prev.map((message) => message.id === aiId ? { ...message, text: accumulated } : message));
      } finally { reader.releaseLock(); }
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

  function runQuickAction(prompt: string) {
    setShowAddMenu(false);
    void ask(prompt);
  }

  function chooseImage(file: File) {
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 9 * 1024 * 1024) { setError("Image is too large. Please choose an image under 9 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageData(String(reader.result)); setImageMime(file.type); setImageName(file.name); setError(""); };
    reader.onerror = () => setError("Could not read that image. Please try another one.");
    reader.readAsDataURL(file);
  }

  return (
    <main className="page lakshya-ai-page">
      {showHistory && (
        <div className="ai-history-overlay" onClick={() => setShowHistory(false)}>
          <aside className="ai-history-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ai-history-head">
              <div><b>Chat history</b><small>Your recent Lakshya AI chats</small></div>
              <button type="button" onClick={() => setShowHistory(false)} aria-label="Close history">×</button>
            </div>
            <button type="button" className="ai-history-new" onClick={startNewChat}>＋ <span>New chat</span></button>
            <div className="ai-history-list">
              {chatHistory.length === 0 ? (
                <div className="ai-history-empty">No previous chats yet.</div>
              ) : chatHistory.map((item) => (
                <button key={item.id} type="button" className={item.id === chatId ? "ai-history-item active" : "ai-history-item"} onClick={() => openHistory(item.id)}>
                  <span>✦</span><span><b>{item.title}</b><small>{new Date(item.updatedAt).toLocaleDateString()}</small></span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
      <header className="ai-topbar">
        <Link href="/" className="ai-back" aria-label="Back to dashboard">←</Link>
        <div className="ai-brand">
          <span className="ai-brand-orb">✦</span>
          <div><b>Lakshya AI</b><small>Study companion</small></div>
        </div>
        <div className="ai-chat-actions">
          <button type="button" className="ai-history-btn" onClick={() => setShowHistory(true)} aria-label="Open chat history">☰ <span>History</span></button>
          <button type="button" className="ai-new-btn" onClick={startNewChat} disabled={loading}>＋ <span>New chat</span></button>
        </div>
        <div className="ai-top-actions">
          <label className="ai-context">
            <span>SUBJECT</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Study subject">
              <option>General</option><option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option><option>English</option>
            </select>
          </label>
          <Link href="/ai/image" className="ai-image-top">✦ <span>Study Image</span></Link><Link href="/qwen-ai" className="ai-image-top ai-openrouter-top">◉ <span>OpenRouter AI</span></Link>
        </div>
      </header>

      <section className="ai-main-shell">
        <div className="ai-intro">
          <div className="ai-intro-copy">
            <span className="ai-kicker">PERSONAL STUDY SPACE</span>
            <h1>What are we learning today?</h1>
            <p>Ask naturally. Lakshya AI explains, practises, revises and plans around your current subject.</p>
          </div>
          <div className="ai-status"><i></i><span>Ready to learn</span></div>
        </div>

        <section className="ai-chat-stage">
          <div ref={conversationRef} className="ai-conversation" aria-live="polite">
            {messages.length === 0 && !loading ? (
              <div className="ai-welcome">
                <div className="ai-welcome-orb"><span>✦</span><i></i><i></i></div>
                <span className="ai-welcome-kicker">LAKSHYA AI</span>
                <h2>Ready when you are.</h2>
                <p>Ask a question, paste a concept, upload a photo or choose an action above.</p>
                <div className="ai-welcome-hints">
                  <button onClick={() => setInput("Explain this concept in simple language with an example.")}>Explain simply</button>
                  <button onClick={() => setInput("Give me a short quiz on my current topic.")}>Test me</button>
                  <button onClick={() => fileRef.current?.click()}>Upload a question</button>
                </div>
              </div>
            ) : messages.map((message) => (
              <article key={message.id} className={`ai-message ${message.role}`}>
                {message.role === "ai" && <span className="ai-avatar">✦</span>}
                <div className="ai-message-body">
                  <span className="ai-message-label">{message.role === "user" ? "YOU" : "LAKSHYA AI"}</span>
                  {message.image && <img className="ai-user-image" src={message.image} alt="Uploaded study material" />}
                  {message.role === "ai" ? <AIResponseContent text={message.text} /> : <p>{message.text}</p>}
                </div>
              </article>
            ))}
            {loading && streamingId === null && (
              <article className="ai-message ai">
                <span className="ai-avatar thinking-avatar">✦</span>
                <div className="ai-message-body">
                  <span className="ai-message-label">LAKSHYA AI</span>
                  <div className="ai-thinking"><b>Thinking through your question</b><small>Preparing a clear study answer…</small><span><i></i><i></i><i></i></span></div>
                </div>
              </article>
            )}
          </div>

          {error && <div className="ai-error" role="alert"><span>⚠</span>{error}<button onClick={() => setError("")}>Dismiss</button></div>}

          <form onSubmit={submit} className="ai-composer">
            {imageData && (
              <div className="ai-image-preview">
                <img src={imageData} alt="Selected study image" />
                <div><b>{imageName || "Study image"}</b><span>Ready for image analysis</span></div>
                <button type="button" onClick={() => { setImageData(""); setImageName(""); }}>Remove</button>
              </div>
            )}
            <div className="ai-composer-box">
              <div className="ai-add-wrap">
                <button type="button" className={`ai-add ${showAddMenu ? "active" : ""}`} onClick={() => setShowAddMenu((v) => !v)} disabled={loading} aria-label="Open study actions">
                  {showAddMenu ? "×" : "+"}
                </button>
                {showAddMenu && (
                  <div className="ai-add-menu" role="menu">
                    <div className="ai-add-menu-title"><span>✦</span><div><b>Study tools</b><small>Choose what you want to do</small></div></div>
                    {prompts.map(([label, prompt], index) => (
                      <button key={label} type="button" className="ai-add-item" onClick={() => runQuickAction(prompt)} disabled={loading}>
                        <span className="ai-add-item-icon">{["✦", "✓", "↻", "◈"][index]}</span>
                        <span><b>{label}</b><small>{["Understand a topic", "Practice questions", "Quick revision", "Study plan"][index]}</small></span>
                      </button>
                    ))}
                    <button type="button" className="ai-add-item" onClick={() => { setShowAddMenu(false); window.location.href="/ai/image"; }}>
                      <span className="ai-add-item-icon">◇</span><span><b>Create Image</b><small>Make a visual study aid</small></span>
                    </button>
                    <button type="button" className="ai-add-item" onClick={() => { setShowAddMenu(false); cameraRef.current?.click(); }}>
                      <span className="ai-add-item-icon">⌾</span><span><b>Camera</b><small>Take a photo of your question</small></span>
                    </button>
                    <button type="button" className="ai-add-item" onClick={() => { setShowAddMenu(false); fileRef.current?.click(); }}>
                      <span className="ai-add-item-icon">⌁</span><span><b>Upload Question</b><small>Choose a photo or notes</small></span>
                    </button>
                    <button type="button" className="ai-add-item" onClick={() => { setShowAddMenu(false); window.dispatchEvent(new CustomEvent("lakshya:open-plugins")); }}>
                      <span className="ai-add-item-icon">⊞</span><span><b>Plugins</b><small>Use connected study tools</small></span>
                    </button>
                  </div>
                )}
              </div>
              <button type="button" className="ai-upload-direct" onClick={() => fileRef.current?.click()} disabled={loading} aria-label="Upload image">▧</button>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={imageData ? "Ask something about this image…" : "Ask Lakshya AI anything about your studies…"} rows={1} maxLength={4000} disabled={loading} />
              <button className="ai-send" disabled={(!input.trim() && !imageData) || loading} aria-label="Send">{loading ? "…" : "↑"}</button>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) chooseImage(f); e.currentTarget.value = ""; }} />
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) chooseImage(f); e.currentTarget.value = ""; }} />
            <div className="ai-composer-meta">
              <span>{input.length}/4000 · {subject}</span>
            </div>
          </form>

        </section>

        <p className="ai-disclaimer">AI can make mistakes. Verify important academic information with your textbook or teacher.</p>
      </section>

      <style jsx>{`
        .lakshya-ai-page{
          --ink:#272238;--muted:#77758a;--line:rgba(91,74,170,.13);
          position:relative;width:100vw;min-height:100dvh;margin-left:calc(50% - 50vw);
          overflow:hidden;background:
            radial-gradient(circle at 7% 8%,rgba(123,92,255,.25),transparent 24%),
            radial-gradient(circle at 94% 12%,rgba(238,74,174,.22),transparent 23%),
            radial-gradient(circle at 84% 78%,rgba(34,211,238,.18),transparent 27%),
            radial-gradient(circle at 14% 82%,rgba(250,190,55,.15),transparent 25%),
            linear-gradient(135deg,#f7f3ff 0%,#eef6ff 38%,#fff1fa 68%,#effdfb 100%);
          background-size:130% 130%;animation:aiBg 18s ease-in-out infinite alternate;
          padding:0 0 42px!important;
        }
        .lakshya-ai-page:before,.lakshya-ai-page:after{content:"";position:absolute;border-radius:50%;filter:blur(75px);pointer-events:none;opacity:.48}
        .lakshya-ai-page:before{width:420px;height:420px;left:-190px;top:18%;background:rgba(105,90,245,.24);animation:orbFloat 10s ease-in-out infinite alternate}
        .lakshya-ai-page:after{width:380px;height:380px;right:-170px;bottom:8%;background:rgba(232,75,174,.20);animation:orbFloat2 12s ease-in-out infinite alternate}
        .lakshya-ai-page>*{position:relative;z-index:1}
        .ai-topbar{
          height:76px;display:flex;align-items:center;gap:16px;padding:0 clamp(16px,4vw,48px);
          background:rgba(255,255,255,.66);border-bottom:1px solid rgba(88,75,150,.10);
          backdrop-filter:blur(22px);position:sticky;top:0;z-index:10;
        }
        .ai-back{width:40px;height:40px;border:1px solid var(--line);border-radius:13px;display:grid;place-items:center;text-decoration:none;color:var(--ink);background:rgba(255,255,255,.7);font-size:22px;transition:.2s}
        .ai-back:hover{transform:translateX(-2px);box-shadow:0 8px 22px rgba(70,55,130,.10)}
        .ai-brand{display:flex;align-items:center;gap:10px;min-width:0}
        .ai-brand-orb{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#705cf5,#df4eb5);box-shadow:0 8px 22px rgba(106,79,226,.23);animation:brandPulse 3s ease-in-out infinite}
        .ai-brand div{display:flex;flex-direction:column}.ai-brand b{font-size:14px;color:var(--ink);font-weight:950}.ai-brand small{font-size:9px;color:#92909e;margin-top:2px}
        .ai-chat-actions{display:flex;align-items:center;gap:6px;margin-left:auto}
        .ai-history-btn,.ai-new-btn{border:1px solid var(--line);background:rgba(255,255,255,.72);color:var(--ink);border-radius:11px;padding:8px 10px;font-size:9px;font-weight:850;cursor:pointer;white-space:nowrap}
        .ai-new-btn{background:linear-gradient(135deg,#705cf5,#df4eb5);color:#fff;border-color:transparent}
        .ai-new-btn:disabled{opacity:.5;cursor:not-allowed}
        .ai-top-actions{display:flex;align-items:center;gap:9px}
        .ai-context{display:flex;align-items:center;gap:7px;padding:6px 9px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.7)}
        .ai-context span{font-size:7px;font-weight:900;letter-spacing:.12em;color:#9693a2}.ai-context select{border:0;background:transparent;outline:0;font-size:10px;font-weight:800;color:var(--ink)}
        .ai-image-top{padding:9px 12px;border-radius:12px;background:linear-gradient(135deg,#f6f2ff,#fff1fa);border:1px solid #ded7f8;color:#604fe0;text-decoration:none;font-size:9px;font-weight:900;transition:.2s}
        .ai-image-top:hover{transform:translateY(-1px)}.ai-openrouter-top{background:linear-gradient(135deg,#eef7ff,#eef1ff);border-color:#cfdcf5;color:#365ea8}
        .ai-main-shell{width:min(1080px,calc(100% - 28px));margin:0 auto;padding:30px 0 0}
        .ai-intro{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px}
        .ai-kicker{font-size:8px;letter-spacing:.18em;font-weight:950;color:#7867dc}.ai-intro h1{margin:7px 0 6px;font-size:clamp(28px,4vw,44px);letter-spacing:-.045em;line-height:1.05;color:#201b34}
        .ai-intro p{margin:0;color:var(--muted);font-size:11px;line-height:1.6;max-width:610px}
        .ai-status{display:flex;align-items:center;gap:7px;white-space:nowrap;padding:8px 11px;border:1px solid rgba(82,160,130,.18);background:rgba(255,255,255,.56);border-radius:999px;color:#5f796e;font-size:9px;font-weight:800}
        .ai-status i{width:6px;height:6px;border-radius:50%;background:#43b887;box-shadow:0 0 0 4px rgba(67,184,135,.10);animation:statusPulse 2s infinite}
        .ai-action-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}.ai-action-rail-bottom{margin-bottom:0}
        .ai-action{display:flex;align-items:center;gap:9px;text-align:left;border:1px solid rgba(105,88,175,.12);border-radius:16px;padding:10px;background:rgba(255,255,255,.63);backdrop-filter:blur(12px);cursor:pointer;color:var(--ink);transition:.22s;text-decoration:none}
        .ai-action:hover{transform:translateY(-2px);border-color:#d6cdf7;box-shadow:0 12px 26px rgba(76,58,150,.09)}
        .ai-action:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .ai-action-icon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:10px;color:#684fe0;background:linear-gradient(135deg,#f1edff,#fff0fa);font-size:12px}
        .ai-action span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}.ai-action b{font-size:10px}.ai-action small{font-size:7px;color:#94919f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ai-action-image{border-color:#d9d0fa;background:linear-gradient(135deg,rgba(250,247,255,.88),rgba(255,239,249,.82))}
        .ai-chat-stage{position:relative;border:1px solid rgba(96,80,164,.12);border-radius:26px;background:rgba(255,255,255,.60);backdrop-filter:blur(24px);box-shadow:0 24px 80px rgba(64,48,125,.10);overflow:hidden}
        .ai-conversation{height:min(57dvh,650px);min-height:410px;overflow:auto;padding:30px clamp(16px,4vw,54px) 24px;scroll-behavior:smooth}
        .ai-welcome{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;max-width:580px;margin:auto}
        .ai-welcome-orb{position:relative;width:86px;height:86px;display:grid;place-items:center;border-radius:28px;color:#fff;background:linear-gradient(135deg,#705cf5,#df4eb5);box-shadow:0 18px 50px rgba(106,79,226,.25);animation:welcomeFloat 3s ease-in-out infinite}
        .ai-welcome-orb span{font-size:32px;z-index:2;animation:spark 1.6s ease-in-out infinite}.ai-welcome-orb i{position:absolute;width:9px;height:9px;border-radius:50%;background:#fff;opacity:.6}.ai-welcome-orb i:first-of-type{top:13px;right:14px;animation:particle 2.2s infinite}.ai-welcome-orb i:last-of-type{bottom:15px;left:13px;animation:particle 2.2s .8s infinite}
        .ai-welcome-kicker{margin-top:22px;font-size:8px;letter-spacing:.18em;font-weight:950;color:#806ce0}.ai-welcome h2{margin:6px 0;font-size:25px;letter-spacing:-.03em;color:#28223f}.ai-welcome p{margin:0;max-width:470px;color:#898697;font-size:11px;line-height:1.7}
        .ai-welcome-hints{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;margin-top:17px}.ai-welcome-hints button{border:1px solid #e1dbf2;background:rgba(255,255,255,.75);border-radius:999px;padding:8px 11px;color:#5e5578;font-size:8px;font-weight:850;cursor:pointer;transition:.2s}.ai-welcome-hints button:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(70,55,130,.08)}
        .ai-message{max-width:820px;margin:0 auto 25px;display:flex;gap:10px;animation:messageIn .3s ease both}.ai-message.user{justify-content:flex-end}.ai-message.ai{justify-content:flex-start}
        .ai-avatar{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:10px;color:#fff;background:linear-gradient(135deg,#705cf5,#df4eb5);font-size:12px;box-shadow:0 7px 20px rgba(106,79,226,.18)}.thinking-avatar{animation:brandPulse 1.5s infinite}
        .ai-message-body{min-width:0;max-width:78%}.ai-message.user .ai-message-body{display:flex;flex-direction:column;align-items:flex-end}.ai-message-label{display:block;margin:0 0 6px;color:#8d8a98;font-size:7px;font-weight:950;letter-spacing:.13em}
        .ai-message.user .ai-message-label{color:#8b78dd}
        .ai-message.user .ai-message-body>p{margin:0;padding:11px 14px;border-radius:18px 18px 5px 18px;background:linear-gradient(135deg,#705cf5,#916ff5);color:#fff;font-size:11px;line-height:1.65;white-space:pre-wrap;box-shadow:0 10px 25px rgba(105,80,225,.16)}
        .ai-rich-response{font-size:11px;line-height:1.8;color:#302e39}.ai-rich-response p{margin:7px 0}.ai-rich-response strong{font-weight:900;color:#1f1d28}.ai-rich-heading{display:flex;gap:7px;align-items:center;font-size:15px;color:#302653;margin:16px 0 6px}.ai-rich-heading span{color:#755cf1;font-size:9px}.ai-rich-list{margin:6px 0 10px;padding-left:20px}.ai-rich-list li{margin:4px 0}.ai-rich-number{display:flex;gap:9px;margin:7px 0}.ai-rich-number>span{font-weight:900;color:#705cf5;min-width:18px}.ai-rich-question{margin:12px 0 7px;padding:10px 12px;border:1px solid #e6defc;background:#f8f5ff;border-radius:12px;font-weight:900}.ai-rich-option{display:flex;gap:9px;padding:7px 9px;margin:4px 0;border:1px solid #e9e6ee;border-radius:10px;background:rgba(255,255,255,.7)}.ai-rich-option b{color:#705cf5}.ai-source-link{color:#604fe0;font-weight:800;text-decoration:none}
        .ai-sources{margin-top:15px;padding-top:12px;border-top:1px solid #e8e4ee}.ai-sources-head{display:flex;align-items:center;gap:7px;font-size:10px;color:#4a4657}.ai-sources-head>span{color:#755cf1}.ai-sources-head em{font-style:normal;font-size:7px;background:#f0edf7;padding:3px 6px;border-radius:999px;color:#888493}.ai-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px}.ai-source-card{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e8e5ed;border-radius:11px;background:rgba(255,255,255,.7);text-decoration:none;color:#44414c;min-width:0}.ai-source-card:hover{border-color:#d6cdf6}.ai-source-favicon{width:22px;height:22px;display:grid;place-items:center;border-radius:7px;background:#f0edff;color:#6552d9;font-size:8px;font-weight:900}.ai-source-copy{flex:1;min-width:0}.ai-source-copy b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ai-source-copy small{display:block;color:#9995a4;font-size:7px;margin-top:2px}.ai-source-card>span:last-child{font-size:10px;color:#898493}
        .ai-thinking{display:flex;align-items:center;gap:9px;padding:7px 0}.ai-thinking b{font-size:10px;color:#514c5b}.ai-thinking small{display:block;font-size:8px;color:#9995a4;margin-top:2px}.ai-thinking>span{display:flex;gap:3px}.ai-thinking i{width:4px;height:4px;border-radius:50%;background:#765cf3;animation:dot 1s infinite}.ai-thinking i:nth-child(2){animation-delay:.15s}.ai-thinking i:nth-child(3){animation-delay:.3s}
        .ai-error{margin:0 20px 10px;padding:9px 11px;border-radius:10px;background:#fff1f1;color:#9b4444;font-size:9px}.ai-error span{margin-right:7px}.ai-error button{float:right;border:0;background:none;text-decoration:underline;font-size:8px}
        .ai-add-wrap{position:relative;flex:0 0 auto}
        .ai-add.active{background:linear-gradient(135deg,#7658ef,#d84eb7);color:#fff;transform:rotate(0deg)}
        .ai-add-menu{
          position:absolute;left:0;bottom:58px;width:min(290px,calc(100vw - 34px));padding:10px;
          border:1px solid rgba(95,76,170,.14);border-radius:22px;background:rgba(255,255,255,.94);
          box-shadow:0 22px 60px rgba(53,40,105,.20);backdrop-filter:blur(24px);animation:addMenuIn .18s ease-out;
          z-index:30;
        }
        .ai-add-menu-title{display:flex;align-items:center;gap:10px;padding:7px 9px 10px;border-bottom:1px solid var(--line);margin-bottom:6px}
        .ai-add-menu-title>span{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#7658ef,#d84eb7)}
        .ai-add-menu-title b,.ai-add-item b{display:block;color:var(--ink);font-size:13px}
        .ai-add-menu-title small,.ai-add-item small{display:block;color:var(--muted);font-size:10px;margin-top:2px}
        .ai-add-item{width:100%;display:flex;align-items:center;gap:10px;padding:9px 8px;border:0;border-radius:14px;background:transparent;text-align:left;cursor:pointer;transition:.16s}
        .ai-add-item:hover{background:rgba(117,88,239,.08);transform:translateX(2px)}
        .ai-add-item:disabled{opacity:.5;cursor:not-allowed}
        .ai-add-item-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;flex:0 0 auto;color:#7658ef;background:linear-gradient(135deg,rgba(118,88,239,.10),rgba(216,78,183,.10));font-weight:800}
        @keyframes addMenuIn{from{opacity:0;transform:translateY(7px) scale(.98)}to{opacity:1;transform:none}}
        .ai-composer{padding:13px 16px 11px;border-top:1px solid rgba(92,75,155,.10);background:rgba(255,255,255,.78);backdrop-filter:blur(20px)}
        .ai-image-preview{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px;border:1px solid #e4def0;border-radius:11px;background:#faf8ff}.ai-image-preview img{width:43px;height:43px;object-fit:cover;border-radius:8px}.ai-image-preview div{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.ai-image-preview b{font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ai-image-preview span{font-size:7px;color:#8f8b99}.ai-image-preview button{border:0;background:none;color:#a24c4c;font-size:8px;font-weight:800}
        .ai-upload-direct{width:34px;height:34px;flex:0 0 34px;border:0;border-radius:11px;background:#f2eff9;color:#6c61a1;font-size:17px;display:grid;place-items:center;cursor:pointer}
        .ai-upload-direct:disabled{opacity:.45;cursor:not-allowed}
        .ai-composer-box{display:flex;align-items:flex-end;gap:8px;padding:7px;border:1px solid #ded9e8;background:rgba(255,255,255,.94);border-radius:18px;box-shadow:0 8px 25px rgba(60,45,120,.06);transition:.2s}.ai-composer-box:focus-within{border-color:#c9bdf2;box-shadow:0 10px 30px rgba(89,67,170,.10)}
        .ai-history-overlay{position:fixed;inset:0;background:rgba(32,25,55,.22);backdrop-filter:blur(5px);z-index:100;display:flex}
        .ai-history-panel{width:min(360px,88vw);height:100%;background:rgba(255,255,255,.97);box-shadow:20px 0 70px rgba(45,32,90,.18);padding:18px;animation:historyIn .2s ease-out}
        .ai-history-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:14px;border-bottom:1px solid var(--line)}
        .ai-history-head b{display:block;font-size:16px;color:var(--ink)}.ai-history-head small{display:block;color:var(--muted);font-size:9px;margin-top:3px}
        .ai-history-head button{border:0;background:#f2eff9;border-radius:10px;width:32px;height:32px;font-size:20px;color:var(--ink)}
        .ai-history-new{width:100%;margin:12px 0 8px;padding:11px;border:0;border-radius:13px;background:linear-gradient(135deg,#705cf5,#df4eb5);color:#fff;font-weight:900;text-align:left;cursor:pointer}
        .ai-history-list{display:flex;flex-direction:column;gap:5px;overflow:auto;max-height:calc(100dvh - 125px)}
        .ai-history-item{display:flex;align-items:center;gap:10px;width:100%;border:0;background:transparent;text-align:left;padding:10px;border-radius:12px;cursor:pointer}
        .ai-history-item:hover,.ai-history-item.active{background:#f5f1ff}.ai-history-item>span:first-child{width:28px;height:28px;border-radius:9px;background:#eeeaff;color:#705cf5;display:grid;place-items:center}
        .ai-history-item b{display:block;color:var(--ink);font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:250px}
        .ai-history-item small{display:block;color:#9b97a5;font-size:7px;margin-top:3px}.ai-history-empty{padding:30px 10px;text-align:center;color:var(--muted);font-size:10px}
        @keyframes historyIn{from{transform:translateX(-20px);opacity:.5}to{transform:none;opacity:1}}
        .ai-add,.ai-send{width:34px;height:34px;flex:0 0 34px;border:0;border-radius:11px;display:grid;place-items:center;cursor:pointer}.ai-add{background:#f2eff9;color:#6c61a1;font-size:21px}.ai-send{background:linear-gradient(135deg,#705cf5,#df4eb5);color:#fff;font-size:17px;font-weight:900;box-shadow:0 6px 17px rgba(105,80,225,.22)}.ai-send:disabled{opacity:.45;box-shadow:none;cursor:not-allowed}.ai-composer-box textarea{flex:1;min-width:0;resize:none;border:0;outline:0;background:transparent;color:#282532;font:inherit;font-size:11px;line-height:1.5;padding:7px 2px;max-height:100px}.ai-composer-meta{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:7px}.ai-composer-meta div{display:flex;gap:5px;flex-wrap:wrap}.ai-composer-meta button,.ai-composer-meta a{border:0;background:transparent;color:#777184;font-size:8px;font-weight:800;padding:2px 4px;text-decoration:none;cursor:pointer}.ai-composer-meta button:hover,.ai-composer-meta a:hover{color:#604fe0}.ai-composer-meta>span{font-size:7px;color:#a09ca8}.ai-user-image{display:block;max-width:300px;max-height:260px;object-fit:contain;border-radius:12px;margin:0 0 8px;border:1px solid #e3dfeb}
        .ai-disclaimer{text-align:center;color:#9995a2;font-size:8px;margin:9px 0 0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        @keyframes aiBg{from{background-position:0 0}to{background-position:100% 100%}}@keyframes orbFloat{from{transform:translate(0,0) scale(.9)}to{transform:translate(70px,45px) scale(1.1)}}@keyframes orbFloat2{from{transform:translate(0,0)}to{transform:translate(-55px,-40px) scale(.85)}}@keyframes brandPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes welcomeFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes spark{0%,100%{transform:scale(.88) rotate(-8deg)}50%{transform:scale(1.12) rotate(10deg)}}@keyframes particle{0%,100%{transform:translateY(0);opacity:.45}50%{transform:translateY(-7px);opacity:1}}@keyframes statusPulse{0%,100%{box-shadow:0 0 0 3px rgba(67,184,135,.08)}50%{box-shadow:0 0 0 6px rgba(67,184,135,.04)}}@keyframes messageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}
        @media(max-width:760px){
          .lakshya-ai-page{padding-bottom:14px!important}
          .ai-topbar{
            min-height:108px;height:auto;padding:8px 9px 7px;gap:7px;
            flex-wrap:wrap;align-items:center;
          }
          .ai-back{width:34px;height:34px;border-radius:11px;font-size:19px;flex:0 0 34px}
          .ai-brand{flex:1 1 auto;min-width:120px}
          .ai-brand-orb{width:34px;height:34px;border-radius:11px}
          .ai-brand b{font-size:14px;font-weight:950;line-height:1.05}
          .ai-brand small{font-size:7px}
          .ai-chat-actions{margin-left:0;gap:5px}
          .ai-history-btn,.ai-new-btn{width:34px;height:34px;padding:0;font-size:0;display:grid;place-items:center;border-radius:11px}
          .ai-history-btn:first-letter,.ai-new-btn:first-letter{font-size:14px}
          .ai-top-actions{
            order:5;width:100%;display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;
            padding:6px 2px 1px;border-top:1px solid rgba(88,75,150,.08);
          }
          .ai-top-actions::-webkit-scrollbar{display:none}
          .ai-context,.ai-image-top{flex:0 0 auto}
          .ai-context{padding:7px 10px;border-radius:11px}
          .ai-context span{display:none}
          .ai-context select{font-size:10px;max-width:90px;font-weight:950}
          .ai-image-top{font-size:9px;padding:8px 11px;border-radius:11px;font-weight:950;white-space:nowrap}
          .ai-main-shell{width:100%;padding:19px 10px 0}
          .ai-intro{align-items:flex-start;margin:0 5px 13px}
          .ai-intro h1{font-size:27px}
          .ai-intro p{font-size:9px;max-width:330px}
          .ai-status{font-size:0;padding:8px}.ai-status i{margin:0}
          .ai-action-rail{display:flex;overflow-x:auto;gap:7px;padding:1px 4px 5px;margin-top:9px;scrollbar-width:none}
          .ai-action-rail-bottom{margin-bottom:0}.ai-action-rail::-webkit-scrollbar{display:none}
          .ai-action{min-width:132px;padding:8px;border-radius:14px}.ai-action-icon{width:27px;height:27px;flex-basis:27px}
          .ai-action b{font-size:9px;font-weight:950}.ai-action small{font-size:7px}
          .ai-chat-stage{border-radius:21px}.ai-conversation{height:calc(100dvh - 385px);min-height:390px;padding:22px 12px 15px}
          .ai-welcome-orb{width:70px;height:70px;border-radius:23px}.ai-welcome-orb span{font-size:26px}
          .ai-welcome h2{font-size:21px;font-weight:950}.ai-welcome p{font-size:9px;padding:0 15px}
          .ai-welcome-hints{padding:0 7px}.ai-welcome-hints button{font-size:7px;font-weight:900}
          .ai-message{gap:7px;margin-bottom:19px}.ai-avatar{width:26px;height:26px;flex-basis:26px;border-radius:9px;font-size:10px}
          .ai-message-body{max-width:86%}.ai-message.user .ai-message-body>p{font-size:10px;padding:9px 11px}
          .ai-rich-response{font-size:10px;line-height:1.75}.ai-rich-heading{font-size:13px}.ai-source-grid{grid-template-columns:1fr}
          .ai-composer{padding:9px 8px 8px}.ai-composer-meta{margin-top:5px}.ai-composer-meta>span{display:none}
          .ai-composer-meta div{overflow:hidden;flex-wrap:nowrap}.ai-composer-meta button,.ai-composer-meta a{font-size:7px;white-space:nowrap}
          .ai-disclaimer{display:none}
        }
        @media(prefers-reduced-motion:reduce){.lakshya-ai-page:before,.lakshya-ai-page:after,.ai-brand-orb,.ai-welcome-orb,.ai-welcome-orb span,.ai-welcome-orb i,.ai-message,.thinking-avatar,.ai-status i,.ai-thinking i{animation:none}}
      `}</style>
    </main>
  );
}
