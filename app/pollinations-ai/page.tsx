"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Model = { id: string; name: string; type: "text" | "image" };
type Message = { id: number; role: "user" | "assistant"; content: string; image?: string };

export default function PollinationsAIPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/ai/pollinations-models", { cache: "no-store" });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Pollinations models could not be loaded.");
        const list = Array.isArray(data.models) ? data.models as Model[] : [];
        setModels(list);
        if (list.length) setSelectedModel(list[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Pollinations models are unavailable.");
      } finally {
        setLoadingModels(false);
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selected = models.find((m) => m.id === selectedModel);
  const isImage = selected?.type === "image";

  function chooseModel(id: string) {
    if (loading) return;
    setSelectedModel(id);
    setMessages([]);
    setError("");
  }

  async function send(text = input) {
    const value = text.trim();
    if (!value || loading || !selectedModel) return;
    const user: Message = { id: Date.now(), role: "user", content: value };
    const next = [...messages, user];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const r = await fetch("/api/ai/pollinations-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          model: selectedModel,
          messages: messages.map(({ role, content }) => ({ role, content })),
          language: localStorage.getItem("lakshya_ai_language") || "hi-en",
          context: "General-purpose AI assistance.",
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Pollinations AI request failed.");
      setMessages([...next, {
        id: Date.now() + 1,
        role: "assistant",
        content: typeof data.text === "string" ? data.text : "",
        image: typeof data.image === "string" ? data.image : undefined,
      }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pollinations AI is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  return (
    <main className="polli-page">
      <header className="polli-header">
        <a className="polli-back" href="/ai">←</a>
        <div className="polli-brand"><span>✺</span><div><b>Pollinations AI</b><small>Multi-model AI workspace</small></div></div>
        <div className="polli-status"><i /> {loadingModels ? "Loading" : "Online"}</div>
      </header>

      <section className="polli-card">
        <div className="polli-modelbar">
          <div><b>Available Models</b><small>{models.length ? `${models.length} models from your Pollinations setup` : "Loading your selected models…"}</small></div>
          <select value={selectedModel} onChange={(e) => chooseModel(e.target.value)} disabled={loading || loadingModels || !models.length}>
            {!models.length && <option value="">Loading models…</option>}
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}{m.type === "image" ? " · IMAGE" : ""}</option>)}
          </select>
        </div>

        <div className="polli-models">
          {models.map((m) => (
            <button key={m.id} type="button" className={selectedModel === m.id ? "active" : ""} onClick={() => chooseModel(m.id)} disabled={loading} title={m.id}>
              {m.name}{m.type === "image" ? " · Image" : ""}
            </button>
          ))}
        </div>

        <div className="polli-toolbar">
          <div><b>{selected?.name || "Pollinations AI"}</b><small>{selected?.id || "Waiting for model catalog"} · {isImage ? "Image generation" : "Text generation"}</small></div>
          <button type="button" onClick={() => { if (!loading) { setMessages([]); setInput(""); setError(""); } }} disabled={loading}>New chat</button>
        </div>

        <div className="polli-messages">
          {messages.length === 0 ? (
            <div className="polli-empty">
              <div className="polli-orb">✺</div>
              <h1>{isImage ? "What do you want to create?" : "What can I help you with?"}</h1>
              <p>Select any model above. Your selected Pollinations model is sent to the backend.</p>
            </div>
          ) : messages.map((m) => (
            <article key={m.id} className={"polli-message " + m.role}>
              <span className="polli-avatar">{m.role === "user" ? "K" : "✺"}</span>
              <div><small>{m.role === "user" ? "YOU" : "POLLINATIONS AI"}</small>{m.content && <p>{m.content}</p>}{m.image && <img className="polli-generated-image" src={m.image} alt="Generated by Pollinations AI" />}</div>
            </article>
          ))}
          {loading && <article className="polli-message assistant"><span className="polli-avatar">✺</span><div><small>POLLINATIONS AI</small><p className="thinking">Working with {selected?.name || "selected model"}…</p></div></article>}
          <div ref={endRef} />
        </div>

        {error && <div className="polli-error">⚠ {error}</div>}

        <form className="polli-composer" onSubmit={submit}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={isImage ? "Describe the image you want…" : "Message Pollinations AI…"} rows={2} disabled={loading || loadingModels} />
          <button type="submit" disabled={loading || loadingModels || !input.trim() || !selectedModel}>{loading ? "…" : "Send →"}</button>
        </form>
      </section>

      <style jsx>{`
        .polli-page{min-height:100dvh;padding:18px 12px 28px;color:#f7f5ff;background:radial-gradient(circle at 8% 0%,rgba(34,211,238,.16),transparent 30%),radial-gradient(circle at 92% 8%,rgba(216,78,183,.18),transparent 34%),linear-gradient(145deg,#111027,#070812)}
        .polli-header{width:min(1100px,100%);margin:0 auto 12px;display:flex;align-items:center;gap:10px}.polli-back{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;color:#fff;text-decoration:none;background:rgba(255,255,255,.07);font-size:20px}.polli-brand{display:flex;align-items:center;gap:9px;flex:1}.polli-brand>span{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#8b5cf6,#d84eb7)}.polli-brand b{display:block;font-size:15px}.polli-brand small{display:block;color:#a8a4b8;font-size:8px}.polli-status{font-size:9px;font-weight:800}.polli-status i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;margin-right:5px}
        .polli-card{width:min(1100px,100%);height:calc(100dvh - 92px);min-height:560px;margin:auto;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(9,9,25,.9)}
        .polli-modelbar{display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}.polli-modelbar>div{flex:1}.polli-modelbar b{display:block;font-size:11px}.polli-modelbar small{display:block;color:#918da2;font-size:8px;margin-top:3px}.polli-modelbar select{max-width:55%;border:1px solid rgba(139,92,246,.35);background:#17152d;color:#fff;border-radius:10px;padding:9px;font-size:9px;outline:0}
        .polli-models{display:flex;gap:7px;padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.08);overflow:auto;max-height:120px;flex-wrap:wrap}.polli-models button{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:#aaa6b9;border-radius:999px;padding:7px 10px;font-size:8px;font-weight:900;white-space:nowrap}.polli-models button.active{background:linear-gradient(135deg,#06b6d4,#7c3aed);color:#fff;border-color:transparent}
        .polli-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.08)}.polli-toolbar b{display:block;font-size:12px}.polli-toolbar small{display:block;color:#918da2;font-size:8px;margin-top:3px}.polli-toolbar button{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#e9e3ff;border-radius:10px;padding:8px 10px;font-size:9px;font-weight:800}
        .polli-messages{flex:1;overflow:auto;padding:22px clamp(13px,4vw,45px)}.polli-empty{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}.polli-orb{width:70px;height:70px;border-radius:22px;display:grid;place-items:center;background:linear-gradient(135deg,#06b6d4,#8b5cf6,#d84eb7);font-size:29px}.polli-empty h1{margin:17px 0 6px;font-size:24px}.polli-empty p{margin:0;color:#aaa6b9;font-size:10px}.polli-message{display:flex;gap:9px;max-width:900px;margin:0 auto 15px}.polli-message.user{justify-content:flex-end;flex-direction:row-reverse}.polli-avatar{width:29px;height:29px;flex:0 0 29px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);font-size:9px;font-weight:900}.polli-message>div{max-width:80%;padding:10px 12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.045)}.polli-message.user>div{background:rgba(124,58,237,.17)}.polli-message small{font-size:7px;letter-spacing:1px;color:#9e99ae;font-weight:900}.polli-message p{white-space:pre-wrap;margin:5px 0 0;font-size:10px;line-height:1.7}.polli-generated-image{display:block;width:min(100%,520px);margin-top:9px;border-radius:12px}.thinking{color:#aaa6b9!important}
        .polli-error{margin:0 15px 9px;padding:9px 11px;border-radius:10px;background:rgba(244,114,182,.1);color:#ffd0e7;font-size:9px}.polli-composer{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16)}.polli-composer textarea{flex:1;resize:none;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);border-radius:12px;padding:11px;color:#fff;outline:0;font-size:11px}.polli-composer button{width:84px;border:0;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#7c3aed,#d84eb7);color:#fff;font-weight:900;font-size:10px}.polli-composer button:disabled{opacity:.45}
        @media(max-width:650px){.polli-page{padding:9px 7px 15px}.polli-card{height:calc(100dvh - 72px);min-height:520px;border-radius:17px}.polli-modelbar{align-items:flex-start;flex-direction:column}.polli-modelbar select{max-width:100%;width:100%}.polli-models{max-height:150px}.polli-empty h1{font-size:21px}.polli-message>div{max-width:86%}.polli-composer button{width:68px}}
      `}</style>
    </main>
  );
}
