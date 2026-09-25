"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { id: number; role: "user" | "assistant"; content: string };

const starters = [
  "Explain Newton's second law in simple Hindi.",
  "Give me one Class 12 Physics MCQ.",
  "Make a short revision plan for today.",
];

export default function PollinationsAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send(text = input) {
    const value = text.trim();
    if (!value || loading) return;
    const user: Message = { id: Date.now(), role: "user", content: value };
    const next = [...messages, user];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/pollinations-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          messages: messages.map(({ role, content }) => ({ role, content })),
          language: localStorage.getItem("lakshya_ai_language") || "hi-en",
          context: "Student education and study assistance.",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Pollinations AI request failed.");
      setMessages([...next, { id: Date.now() + 1, role: "assistant", content: String(data.text || "") }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pollinations AI is unavailable.");
    } finally { setLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(); }

  return (
    <main className="polli-page">
      <header className="polli-header">
        <a className="polli-back" href="/ai">←</a>
        <div className="polli-brand"><span>✺</span><div><b>Pollinations AI</b><small>Chat assistant</small></div></div>
        <div className="polli-status"><i /> Online</div>
      </header>

      <section className="polli-card">
        <div className="polli-toolbar">
          <div><b>Pollinations AI Chat</b><small>Ask questions, learn concepts and practise.</small></div>
          <button type="button" onClick={() => { if (!loading) { setMessages([]); setInput(""); setError(""); } }} disabled={loading}>New chat</button>
        </div>

        <div className="polli-messages">
          {messages.length === 0 ? (
            <div className="polli-empty">
              <div className="polli-orb">✺</div>
              <h1>What do you want to learn?</h1>
              <p>Pollinations AI is connected as a separate chat provider beside OpenRouter.</p>
              <div className="polli-starters">{starters.map((item) => <button key={item} onClick={() => void send(item)} disabled={loading}>{item}</button>)}</div>
            </div>
          ) : messages.map((m) => (
            <article key={m.id} className={\`polli-message \${m.role}\`}>
              <span className="polli-avatar">{m.role === "user" ? "K" : "✺"}</span>
              <div><small>{m.role === "user" ? "YOU" : "POLLINATIONS AI"}</small><p>{m.content}</p></div>
            </article>
          ))}
          {loading && <article className="polli-message assistant"><span className="polli-avatar">✺</span><div><small>POLLINATIONS AI</small><p className="thinking">Thinking…</p></div></article>}
          <div ref={endRef} />
        </div>

        {error && <div className="polli-error">⚠ {error}</div>}

        <form className="polli-composer" onSubmit={submit}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message Pollinations AI…" rows={2} disabled={loading} />
          <button type="submit" disabled={loading || !input.trim()}>{loading ? "…" : "Send →"}</button>
        </form>
      </section>

      <style jsx>{\`
        .polli-page{min-height:100dvh;padding:22px 14px 34px;color:#f7f5ff;background:radial-gradient(circle at 8% 0%,rgba(34,211,238,.16),transparent 30%),radial-gradient(circle at 92% 8%,rgba(216,78,183,.18),transparent 34%),linear-gradient(145deg,#111027,#070812)}
        .polli-header{width:min(1100px,100%);margin:0 auto 14px;display:flex;align-items:center;gap:10px}.polli-back{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;color:#fff;text-decoration:none;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);font-size:20px}.polli-brand{display:flex;align-items:center;gap:9px;flex:1}.polli-brand>span{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#8b5cf6,#d84eb7);font-size:18px}.polli-brand b{display:block;font-size:15px}.polli-brand small{display:block;color:#a8a4b8;font-size:8px;margin-top:2px}.polli-status{font-size:9px;font-weight:800;border:1px solid rgba(52,211,153,.22);background:rgba(52,211,153,.08);border-radius:999px;padding:8px 10px}.polli-status i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;margin-right:5px}
        .polli-card{width:min(1100px,100%);height:calc(100dvh - 105px);min-height:560px;margin:auto;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(9,9,25,.88);box-shadow:0 25px 80px rgba(0,0,0,.34)}
        .polli-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:14px 17px;border-bottom:1px solid rgba(255,255,255,.08)}.polli-toolbar b{display:block;font-size:12px}.polli-toolbar small{display:block;color:#918da2;font-size:8px;margin-top:3px}.polli-toolbar button{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#e9e3ff;border-radius:10px;padding:8px 10px;font-size:9px;font-weight:800}
        .polli-messages{flex:1;overflow:auto;padding:24px clamp(13px,4vw,45px)}.polli-empty{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}.polli-orb{width:72px;height:72px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,#06b6d4,#8b5cf6,#d84eb7);font-size:30px;box-shadow:0 16px 45px rgba(34,211,238,.2)}.polli-empty h1{margin:18px 0 6px;font-size:25px}.polli-empty p{margin:0;color:#aaa6b9;font-size:10px;line-height:1.6}.polli-starters{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:18px}.polli-starters button{border:1px solid rgba(139,92,246,.25);background:rgba(139,92,246,.1);color:#e5ddff;border-radius:999px;padding:8px 10px;font-size:8px}
        .polli-message{display:flex;gap:9px;max-width:900px;margin:0 auto 15px}.polli-message.user{justify-content:flex-end;flex-direction:row-reverse}.polli-avatar{width:29px;height:29px;flex:0 0 29px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);font-size:9px;font-weight:900}.polli-message>div{max-width:78%;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.045)}.polli-message.user>div{background:rgba(124,58,237,.17)}.polli-message small{font-size:7px;letter-spacing:1px;color:#9e99ae;font-weight:900}.polli-message p{white-space:pre-wrap;margin:5px 0 0;font-size:10px;line-height:1.7}.thinking{color:#aaa6b9!important}
        .polli-error{margin:0 15px 9px;padding:9px 11px;border-radius:10px;background:rgba(244,114,182,.1);border:1px solid rgba(244,114,182,.2);color:#ffd0e7;font-size:9px}.polli-composer{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16)}.polli-composer textarea{flex:1;resize:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);border-radius:12px;padding:11px;color:#fff;outline:0;font-size:11px}.polli-composer button{width:84px;border:0;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#7c3aed,#d84eb7);color:#fff;font-weight:900;font-size:10px}.polli-composer button:disabled{opacity:.45}
        @media(max-width:650px){.polli-page{padding:10px 8px 18px}.polli-card{height:calc(100dvh - 78px);min-height:520px;border-radius:18px}.polli-empty h1{font-size:21px}.polli-starters{display:grid;width:100%}.polli-starters button{text-align:left}.polli-message>div{max-width:84%}.polli-composer button{width:68px}}
      \`}</style>
    </main>
  );
}
