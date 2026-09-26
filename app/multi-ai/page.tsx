"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Model = {
  id: string;
  name: string;
  provider: string;
  category: string;
  capabilities: string[];
};

type Result = {
  modelId: string;
  status: "idle" | "running" | "completed" | "failed" | "cancelled";
  text: string;
  error?: string;
  latencyMs?: number;
};

const CATEGORY_ORDER = [
  "General Reasoning",
  "Coding & Reasoning",
  "Math & Science",
  "Research",
  "Vision",
  "Fast",
  "Image",
];

export default function MultiAIPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [task, setTask] = useState("");
  const [results, setResults] = useState<Record<string, Result>>({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/ai/multi-model/models")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load models.");
        return res.json();
      })
      .then((data) => setModels(Array.isArray(data.models) ? data.models : []))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load models."));
  }, []);

  const categories = useMemo(() => {
    const values = [...new Set(models.map((m) => m.category))];
    return ["All", ...CATEGORY_ORDER.filter((x) => values.includes(x)), ...values.filter((x) => !CATEGORY_ORDER.includes(x))];
  }, [models]);

  const visibleModels = useMemo(
    () => filter === "All" ? models : models.filter((m) => m.category === filter),
    [models, filter],
  );

  function toggleModel(id: string) {
    setSelected((current) => current.includes(id)
      ? current.filter((x) => x !== id)
      : current.length >= 5 ? current : [...current, id]);
  }

  function selectVisibleCategory() {
    const ids = visibleModels.map((m) => m.id).filter((id) => !selected.includes(id));
    setSelected((current) => [...current, ...ids].slice(0, 5));
  }

  function clearSelection() {
    setSelected([]);
    if (!running) setResults({});
  }

  async function runAll(modelIds = selected) {
    const prompt = task.trim();
    if (!prompt || !modelIds.length || running) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setError("");
    const resetResults: Record<string, Result> = {};\n    modelIds.forEach((id) => { resetResults[id] = { modelId: id, status: "idle", text: "" }; });\n    setResults((current) => ({ ...current, ...resetResults }));

    try {
      const response = await fetch("/api/ai/multi-model", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ task: prompt, models: modelIds, language: localStorage.getItem("lakshya_ai_language") || "hi-en" }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = "Multi-Model AI request failed.";
        try { message = (await response.json()).error || message; } catch {}
        throw new Error(message);
      }
      if (!response.body) throw new Error("No response stream was returned.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyEvent = (line: string) => {
        if (!line.trim()) return;
        try {
          const e = JSON.parse(line) as { type: string; modelId?: string; text?: string; error?: string; latencyMs?: number };
          if (!e.modelId) return;
          setResults((current) => {
            const previous = current[e.modelId!] || { modelId: e.modelId!, status: "idle", text: "" };
            if (e.type === "model_started") return { ...current, [e.modelId!]: { ...previous, status: "running" } };
            if (e.type === "model_delta") return { ...current, [e.modelId!]: { ...previous, status: "running", text: previous.text + (e.text || "") } };
            if (e.type === "model_completed") return { ...current, [e.modelId!]: { ...previous, status: "completed", text: e.text || previous.text, latencyMs: e.latencyMs } };
            if (e.type === "model_failed") return { ...current, [e.modelId!]: { ...previous, status: "failed", error: e.error, latencyMs: e.latencyMs } };
            return current;
          });
        } catch {}
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        lines.forEach(applyEvent);
      }
      buffer += decoder.decode();
      buffer.split(/\r?\n/).forEach(applyEvent);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setResults((current) => Object.fromEntries(Object.entries(current).map(([id, result]) =>
          result.status === "running" || result.status === "idle" ? [id, { ...result, status: "cancelled" }] : [id, result],
        )));
      } else {
        setError(e instanceof Error ? e.message : "Multi-Model AI is temporarily unavailable.");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stopAll() {
    abortRef.current?.abort();
    setRunning(false);
  }

  function copy(text: string) {
    void navigator.clipboard?.writeText(text);
  }

  return (
    <main className="multi-ai-page">
      <header className="multi-ai-header">
        <div className="multi-ai-brand">
          <Link href="/ai" aria-label="Back to Lakshya AI">←</Link>
          <div className="multi-ai-orb">✦</div>
          <div><b>Multi-Model AI</b><small>Compare up to 5 models on the same task</small></div>
        </div>
        <div className="multi-ai-actions">
          <span className="multi-ai-count">{selected.length}/5 selected</span>
          <button onClick={clearSelection} disabled={running && selected.length === 0}>Clear</button>
          {running ? <button className="danger" onClick={stopAll}>Stop All</button> : <button className="primary" onClick={() => void runAll()} disabled={!task.trim() || !selected.length}>Run All</button>}
        </div>
      </header>

      <section className="multi-ai-controls">
        <div className="multi-ai-task">
          <label>ONE TASK FOR EVERY SELECTED MODEL</label>
          <textarea value={task} onChange={(e) => setTask(e.target.value)} placeholder="Give one task. Every selected model receives the same prompt." rows={4} disabled={running} />
        </div>
        <div className="multi-ai-models">
          <div className="multi-ai-section-head">
            <div><b>Select models</b><small>Choose up to five available models.</small></div>
            <button onClick={selectVisibleCategory} disabled={running || selected.length >= 5}>Add visible</button>
          </div>
          <div className="multi-ai-filters">
            {categories.map((category) => <button key={category} className={filter === category ? "active" : ""} onClick={() => setFilter(category)}>{category}</button>)}
          </div>
          <div className="multi-ai-model-grid">
            {visibleModels.map((model) => {
              const active = selected.includes(model.id);
              return (
                <button key={model.id} className={active ? "model-card selected" : "model-card"} onClick={() => toggleModel(model.id)} disabled={running}>
                  <span className="model-check">{active ? "✓" : "+"}</span>
                  <div><b>{model.name}</b><small>{model.provider} · {model.category}</small></div>
                </button>
              );
            })}
            {!visibleModels.length && <div className="multi-ai-empty">No models are available in this category right now.</div>}
          </div>
        </div>
      </section>

      {error && <div className="multi-ai-error">⚠ {error}</div>}

      <section className="multi-ai-results">
        <div className="multi-ai-results-head"><div><b>Live comparison</b><small>Each model runs independently. A failed model does not stop the others.</small></div></div>
        <div className="multi-ai-result-grid">
          {selected.map((id) => {
            const model = models.find((m) => m.id === id);
            const result = results[id] || { modelId: id, status: "idle", text: "" };
            return (
              <article key={id} className="result-card">
                <header><div><b>{model?.name || id}</b><small>{model?.provider || "Model"}</small></div><span className={`status ${result.status}`}>{result.status}</span></header>
                <div className="result-body">
                  {result.status === "idle" && <div className="result-placeholder">Ready</div>}
                  {result.status === "running" && !result.text && <div className="result-placeholder"><i></i><i></i><i></i> Generating…</div>}
                  {result.text && <pre>{result.text}</pre>}
                  {result.status === "failed" && <div className="result-failure">⚠ {result.error || "Request failed."}<button onClick={() => void runAll([id])}>Retry</button></div>}
                  {result.status === "cancelled" && <div className="result-placeholder">Cancelled</div>}
                </div>
                <footer>
                  <span>{result.latencyMs ? `${(result.latencyMs / 1000).toFixed(1)}s` : "—"}</span>
                  <button onClick={() => copy(result.text)} disabled={!result.text}>Copy</button>
                </footer>
              </article>
            );
          })}
          {!selected.length && <div className="multi-ai-no-results"><span>✦</span><b>Select models and run one task</b><small>Your responses will appear here simultaneously.</small></div>}
        </div>
      </section>

      <style jsx>{`
        .multi-ai-page{min-height:calc(100dvh - 68px);padding:18px 22px 36px;background:radial-gradient(circle at 10% 0%,#efeaff 0,transparent 32%),radial-gradient(circle at 90% 10%,#ffe9f5 0,transparent 30%),#f8f7fc;color:#252233}
        .multi-ai-header{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:14px}
        .multi-ai-brand{display:flex;align-items:center;gap:10px}.multi-ai-brand>a{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;background:#fff;text-decoration:none;color:#5d4bd8;font-size:20px;box-shadow:0 6px 22px #49348a14}.multi-ai-orb{width:40px;height:40px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,#725cf6,#dc4db7);color:#fff;font-size:20px;box-shadow:0 8px 24px #7b57ef38}.multi-ai-brand b{display:block;font-size:18px;font-weight:950}.multi-ai-brand small{display:block;color:#827d8f;font-size:10px;margin-top:2px}
        .multi-ai-actions{display:flex;align-items:center;gap:7px}.multi-ai-count{padding:8px 11px;border-radius:10px;background:#fff;color:#665c7c;font-size:10px;font-weight:900}.multi-ai-actions button,.multi-ai-section-head button{border:1px solid #e5e0ee;background:#fff;border-radius:10px;padding:8px 11px;font-weight:850;font-size:10px;cursor:pointer}.multi-ai-actions button.primary{border:0;color:#fff;background:linear-gradient(135deg,#705cf5,#df4eb5)}.multi-ai-actions button.danger{border:0;color:#fff;background:#a84c67}.multi-ai-actions button:disabled,.multi-ai-section-head button:disabled{opacity:.45;cursor:not-allowed}
        .multi-ai-controls{display:grid;grid-template-columns:minmax(280px,.85fr) minmax(480px,1.4fr);gap:14px;margin-bottom:14px}.multi-ai-task,.multi-ai-models,.multi-ai-results{background:rgba(255,255,255,.88);border:1px solid #e6e1ef;border-radius:18px;box-shadow:0 12px 40px #3f2c7510}.multi-ai-task{padding:15px}.multi-ai-task label{display:block;font-size:9px;font-weight:950;color:#796d90;margin-bottom:8px}.multi-ai-task textarea{width:100%;box-sizing:border-box;border:1px solid #e1dce9;border-radius:13px;padding:12px;resize:vertical;min-height:125px;outline:0;font:inherit;font-size:12px;line-height:1.6;background:#fff}.multi-ai-task textarea:focus{border-color:#b9aaf0;box-shadow:0 0 0 3px #735cf512}
        .multi-ai-models{padding:15px}.multi-ai-section-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.multi-ai-section-head b{display:block;font-size:13px}.multi-ai-section-head small{display:block;font-size:9px;color:#8d8797;margin-top:2px}.multi-ai-filters{display:flex;gap:6px;overflow:auto;margin:12px 0 10px;padding-bottom:2px}.multi-ai-filters button{white-space:nowrap;border:1px solid #e7e2ef;background:#fff;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:850;color:#756d82;cursor:pointer}.multi-ai-filters button.active{background:#28213d;color:#fff;border-color:#28213d}.multi-ai-model-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;max-height:190px;overflow:auto}.model-card{display:flex;align-items:center;gap:9px;text-align:left;border:1px solid #e6e1ef;background:#fff;border-radius:12px;padding:9px;cursor:pointer}.model-card.selected{border-color:#a995ef;background:#f7f3ff;box-shadow:0 0 0 2px #735cf512}.model-card:disabled{cursor:not-allowed;opacity:.7}.model-check{width:25px;height:25px;display:grid;place-items:center;flex:0 0 25px;border-radius:8px;background:#f0edf7;color:#7564b8;font-weight:950}.model-card.selected .model-check{background:linear-gradient(135deg,#705cf5,#df4eb5);color:#fff}.model-card b{display:block;font-size:10px;color:#2d273b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.model-card small{display:block;font-size:7px;color:#938c9e;margin-top:3px}.multi-ai-empty{grid-column:1/-1;padding:20px;text-align:center;color:#8c8595;font-size:10px}
        .multi-ai-error{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:#fff1f3;color:#8c3448;border:1px solid #f0ccd4;font-size:10px;font-weight:800}
        .multi-ai-results{padding:15px}.multi-ai-results-head{margin-bottom:12px}.multi-ai-results-head b{font-size:14px}.multi-ai-results-head small{display:block;color:#8d8797;font-size:9px;margin-top:3px}.multi-ai-result-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}.result-card{min-height:320px;display:flex;flex-direction:column;border:1px solid #e6e1ef;border-radius:15px;background:#fff;overflow:hidden}.result-card header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 12px;border-bottom:1px solid #eeeaf3}.result-card header b{display:block;font-size:10px}.result-card header small{display:block;font-size:7px;color:#958e9f;margin-top:2px}.status{text-transform:uppercase;font-size:7px;font-weight:950;padding:5px 7px;border-radius:999px;background:#f0edf5;color:#777080}.status.running{background:#eeeaff;color:#624ed5}.status.completed{background:#e8f8ef;color:#28774b}.status.failed{background:#fff0f2;color:#a33e54}.status.cancelled{background:#f3f1f5;color:#797280}.result-body{flex:1;padding:13px;overflow:auto}.result-body pre{margin:0;white-space:pre-wrap;word-break:break-word;font:inherit;font-size:11px;line-height:1.7;color:#302a3c}.result-placeholder{height:100%;min-height:240px;display:flex;align-items:center;justify-content:center;gap:5px;color:#9b94a4;font-size:10px}.result-placeholder i{width:5px;height:5px;border-radius:50%;background:#9c89e8;animation:pulse .8s infinite alternate}.result-placeholder i:nth-child(2){animation-delay:.15s}.result-placeholder i:nth-child(3){animation-delay:.3s}.result-failure{color:#a33e54;font-size:10px;line-height:1.6}.result-failure button{display:block;margin-top:10px;border:1px solid #e7d2d8;background:#fff;border-radius:8px;padding:6px 9px;font-size:8px;font-weight:900}.result-card footer{display:flex;justify-content:space-between;align-items:center;padding:8px 11px;border-top:1px solid #eeeaf3;color:#9a93a2;font-size:8px}.result-card footer button{border:0;background:transparent;color:#6655bd;font-weight:900;font-size:8px;cursor:pointer}.multi-ai-no-results{grid-column:1/-1;min-height:300px;display:grid;place-items:center;align-content:center;gap:5px;text-align:center;color:#8c8595}.multi-ai-no-results span{font-size:35px;color:#735cf5}.multi-ai-no-results b{font-size:14px;color:#3b3449}.multi-ai-no-results small{font-size:9px}@keyframes pulse{to{opacity:.25;transform:translateY(-3px)}}
        @media(max-width:900px){.multi-ai-page{padding:12px 10px 82px}.multi-ai-header{align-items:flex-start}.multi-ai-brand small{max-width:170px}.multi-ai-actions{flex-wrap:wrap;justify-content:flex-end}.multi-ai-controls{grid-template-columns:1fr}.multi-ai-model-grid{max-height:240px}}
        @media(max-width:600px){.multi-ai-brand b{font-size:15px}.multi-ai-brand small{font-size:8px}.multi-ai-actions .multi-ai-count{display:none}.multi-ai-actions button{padding:8px}.multi-ai-result-grid{grid-template-columns:1fr}.multi-ai-model-grid{grid-template-columns:1fr}.result-card{min-height:280px}.result-placeholder{min-height:200px}.multi-ai-task textarea{font-size:11px}}
      `}</style>
    </main>
  );
}
