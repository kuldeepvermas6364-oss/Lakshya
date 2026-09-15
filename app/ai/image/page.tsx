"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const presets = [
  ["Physics diagram", "Create a clean, accurate educational diagram for a Class 12 Physics concept. Use clear labels, simple shapes, white background, textbook-style presentation."],
  ["Concept map", "Create a student-friendly concept map for this topic. Organize the main idea, key formulas, relationships and examples clearly."],
  ["Project visual", "Create a polished educational illustration for a school science project. Make it realistic, clean, labelled and suitable for a Class 12 project."],
];

export default function ImageAIPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    const value = prompt.trim();
    if (!value || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation failed.");
      setImage(data.image || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <section className="ai-spotlight" style={{ marginTop: 0 }}>
        <div className="ai-copy">
          <span className="ai-badge">✦ LAKSHYA AI · IMAGE STUDIO</span>
          <h1 style={{ fontSize: "clamp(36px,6vw,64px)", letterSpacing: "-.05em", lineHeight: 1, margin: "12px 0" }}>Turn ideas into study visuals.</h1>
          <p>This dedicated Gemini image AI is focused only on creating useful educational images, diagrams and project visuals.</p>
        </div>
        <Link className="ai-cta" href="/ai">← Lakshya AI</Link>
      </section>

      <section className="panel" style={{ marginTop: 14, padding: 22 }}>
        <div className="section-heading" style={{ marginBottom: 14 }}>
          <div><span className="section-eyebrow">IMAGE GENERATOR</span><h2>What should I create?</h2></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {presets.map(([label, text]) => <button key={label} className="secondary" type="button" onClick={() => setPrompt(text)} disabled={loading}>{label}</button>)}
        </div>
        <form onSubmit={generate}>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={2000} rows={5} placeholder="Example: Draw a labelled electric circuit showing a cell, resistor, switch and ammeter for a Class 12 Physics project..." disabled={loading} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", border: "1px solid #e1e0eb", borderRadius: 14, padding: 14, font: "inherit", fontSize: 13, outline: "none", background: "#fbfbff" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 10 }}>{prompt.length}/2000 · Gemini Image AI</span>
            <button className="primary" type="submit" disabled={!prompt.trim() || loading}>{loading ? "Creating image…" : "Generate image →"}</button>
          </div>
        </form>
      </section>

      {error && <section className="ai-error" style={{ margin: "14px 0 0" }} role="alert">{error}</section>}

      <section className="panel" style={{ marginTop: 14, minHeight: 300, display: "grid", placeItems: "center", padding: 22 }}>
        {loading ? <div style={{ textAlign: "center" }}><div className="ai-empty-icon" style={{ margin: "0 auto 14px" }}>✦</div><h3>Creating your study visual…</h3><p className="muted">Gemini is generating the image. This can take a little while.</p></div> : image ? <div style={{ width: "100%", textAlign: "center" }}><img src={image} alt="AI generated study visual" style={{ maxWidth: "100%", maxHeight: 720, borderRadius: 16, border: "1px solid #e7e5ef", display: "block", margin: "0 auto" }} /><div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}><a className="secondary" href={image} download="lakshya-study-image.png">Download image</a><button className="secondary" type="button" onClick={() => void generate()}>Regenerate</button></div></div> : <div style={{ textAlign: "center", maxWidth: 500 }}><div className="ai-empty-icon" style={{ margin: "0 auto 14px" }}>◎</div><h3>Your generated image will appear here.</h3><p className="muted">Use this studio for diagrams, concept maps, project visuals and other genuinely useful study images.</p></div>}
      </section>
    </main>
  );
}
