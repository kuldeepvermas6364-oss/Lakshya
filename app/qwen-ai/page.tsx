"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const models = [
  ["openrouter/free", "OpenRouter Free Router"],
  ["deepseek/deepseek-v4-flash:free", "DeepSeek V4 Flash (Free)"],
  ["openai/gpt-oss-20b:free", "GPT-OSS 20B (Free)"],
  ["poolside/laguna-s-2.1:free", "Laguna S 2.1 (Free)"],
  ["inclusionai/ling-3.0-flash-sante:free", "Ling 3.0 Flash Sante (Free)"],
  ["openai/gpt-5.6-luna", "GPT-5.6 Luna"],
  ["openai/gpt-5.6-sol", "GPT-5.6 Sol"],
  ["meta/muse-spark-1.2-contributor", "Muse Spark 1.2 Contributor"],
] as const;

const starter = [
  "Hello OpenRouter, give me a short test response.",
  "Explain Newton's second law in simple Hindi.",
  "Give me one Class 12 Physics MCQ.",
];

export default function QwenTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>(models[0][0]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text = input) {
    const value = text.trim();
    if (!value || loading) return;

    const userMessage: Message = { id: Date.now(), role: "user", content: value };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/qwen-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          messages: messages.map(({ role, content }) => ({ role, content })),
          model: selectedModel,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Qwen request failed.");

      setMessages([
        ...nextHistory,
        { id: Date.now() + 1, role: "assistant", content: String(data.text || "") },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qwen test AI is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  function clearChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError("");
  }

  return (
    <main className="qwen-test-page">
      <header className="qwen-test-header">
        <div>
          <span className="qwen-test-kicker">AI CONNECTION TEST</span>
          <h1>OpenRouter AI Test</h1>
          <p>Temporary test tab for checking the OpenRouter → OpenRouter connection.</p>
        </div>
        <div className="qwen-test-status"><i /> OpenRouter · verified catalog</div>
      </header>

      <section className="qwen-test-card">
        <div className="qwen-model-picker"><label>Model</label><select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} disabled={loading}>{models.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>

        <div className="qwen-test-toolbar">
          <div><b>Chat test</b><small>Messages stay in this page only.</small></div>
          <button type="button" onClick={clearChat} disabled={loading}>Clear</button>
        </div>

        {messages.length === 0 ? (
          <div className="qwen-test-empty">
            <div className="qwen-orb">Q</div>
            <h2>OpenRouter connection ready to test</h2>
            <p>Send a message below. If the key is connected in Vercel, the reply will come through OpenRouter.</p>
            <div className="qwen-starters">
              {starter.map((item) => (
                <button key={item} type="button" onClick={() => void send(item)} disabled={loading}>{item}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="qwen-messages">
            {messages.map((message) => (
              <article key={message.id} className={`qwen-message ${message.role}`}>
                <span className="qwen-avatar">{message.role === "user" ? "K" : "Q"}</span>
                <div>
                  <small>{message.role === "user" ? "YOU" : "OPENROUTER AI"}</small>
                  <p>{message.content}</p>
                </div>
              </article>
            ))}
            {loading && (
              <article className="qwen-message assistant">
                <span className="qwen-avatar">Q</span>
                <div><small>OPENROUTER AI</small><p className="qwen-thinking">Thinking…</p></div>
              </article>
            )}
            <div ref={endRef} />
          </div>
        )}

        {error && <div className="qwen-error">⚠ {error}</div>}

        <form className="qwen-composer" onSubmit={submit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Test OpenRouter here…"
            rows={2}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>{loading ? "…" : "Send →"}</button>
        </form>
      </section>

      <p className="qwen-env-note">Vercel Environment Variable: <b>OPENROUTER_API_KEY</b></p>

      <style jsx>{`
        .qwen-test-page{min-height:calc(100vh - 68px);padding:30px clamp(16px,4vw,52px) 44px;background:radial-gradient(circle at 10% 0%,rgba(34,211,238,.13),transparent 30%),radial-gradient(circle at 90% 10%,rgba(192,38,211,.16),transparent 32%);color:#f4f1ff}
        .qwen-test-header{max-width:1100px;margin:0 auto 18px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end}
        .qwen-test-kicker{font-size:9px;letter-spacing:2px;color:#67e8f9;font-weight:900}
        .qwen-test-header h1{margin:7px 0 5px;font-size:clamp(28px,4vw,44px);letter-spacing:-1px}
        .qwen-test-header p{margin:0;color:#a9a6bd;font-size:12px}
        .qwen-test-status{white-space:nowrap;border:1px solid rgba(34,211,238,.25);background:rgba(34,211,238,.08);border-radius:999px;padding:9px 12px;font-size:10px;font-weight:800}
        .qwen-test-status i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#34d399;margin-right:6px}
        .qwen-test-card{max-width:1100px;min-height:620px;margin:auto;display:flex;flex-direction:column;background:linear-gradient(145deg,rgba(20,19,44,.96),rgba(8,9,23,.98));border:1px solid rgba(255,255,255,.09);border-radius:24px;box-shadow:0 22px 70px rgba(0,0,0,.32);overflow:hidden}
        .qwen-model-picker{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px}.qwen-model-picker label{font-size:9px;color:#9f9ab1;font-weight:900}.qwen-model-picker select{flex:1;max-width:520px;border:1px solid rgba(255,255,255,.1);background:#121127;color:#fff;border-radius:10px;padding:9px;font-size:10px;outline:0}.qwen-test-toolbar{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025)}
        .qwen-test-toolbar b,.qwen-test-toolbar small{display:block}.qwen-test-toolbar b{font-size:13px}.qwen-test-toolbar small{font-size:9px;color:#858197;margin-top:3px}
        .qwen-test-toolbar button{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#ddd6fe;border-radius:9px;padding:8px 11px;font-size:9px;font-weight:800}
        .qwen-test-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:45px 20px}
        .qwen-orb{width:70px;height:70px;border-radius:23px;display:grid;place-items:center;font-size:28px;font-weight:900;background:linear-gradient(135deg,#06b6d4,#8b5cf6,#c026d3);box-shadow:0 14px 40px rgba(34,211,238,.22);margin-bottom:18px}
        .qwen-test-empty h2{margin:0 0 7px;font-size:21px}.qwen-test-empty p{max-width:610px;margin:0;color:#a9a6bd;font-size:11px;line-height:1.7}
        .qwen-starters{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:20px}.qwen-starters button{border:1px solid rgba(139,92,246,.2);background:rgba(139,92,246,.08);color:#ddd6fe;border-radius:999px;padding:9px 11px;font-size:9px}
        .qwen-messages{flex:1;overflow:auto;padding:25px clamp(15px,4vw,45px);display:grid;align-content:start;gap:15px}
        .qwen-message{display:flex;gap:10px;max-width:900px}.qwen-message.user{margin-left:auto;flex-direction:row-reverse}.qwen-avatar{width:30px;height:30px;flex:0 0 30px;border-radius:10px;display:grid;place-items:center;font-size:10px;font-weight:900;background:linear-gradient(135deg,#7c3aed,#06b6d4)}
        .qwen-message>div{max-width:78%;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.045);border-radius:14px;padding:10px 12px}.qwen-message.user>div{background:rgba(124,58,237,.16)}
        .qwen-message small{font-size:8px;letter-spacing:1px;color:#9f9ab1;font-weight:900}.qwen-message p{white-space:pre-wrap;margin:5px 0 0;font-size:11px;line-height:1.65}.qwen-thinking{color:#a9a6bd!important}
        .qwen-error{margin:0 18px 10px;padding:10px 12px;border-radius:10px;background:rgba(244,114,182,.1);border:1px solid rgba(244,114,182,.18);color:#fbcfe8;font-size:10px}
        .qwen-composer{display:flex;gap:8px;padding:13px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.12)}.qwen-composer textarea{flex:1;resize:none;border:1px solid rgba(255,255,255,.1)!important;background:rgba(255,255,255,.05)!important;border-radius:12px;padding:11px;color:#fff!important;outline:0;font-size:11px;line-height:1.5}.qwen-composer button{width:85px;border:0;border-radius:12px;background:linear-gradient(135deg,#06b6d4,#7c3aed);color:#fff;font-weight:900;font-size:10px}.qwen-composer button:disabled{opacity:.45}
        .qwen-env-note{max-width:1100px;margin:10px auto 0;color:#77728a;font-size:9px}.qwen-env-note b{color:#a78bfa}
        @media(max-width:700px){.qwen-test-page{padding:18px 12px 35px}.qwen-test-header{align-items:flex-start;flex-direction:column}.qwen-test-status{font-size:9px}.qwen-test-card{min-height:calc(100vh - 190px);border-radius:18px}.qwen-message>div{max-width:82%}.qwen-starters{display:grid;width:100%}.qwen-starters button{text-align:left}.qwen-composer button{width:72px}}
      `}</style>
    </main>
  );
}
