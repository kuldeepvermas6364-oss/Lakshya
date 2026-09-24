"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type SavedImage = { id: string; image: string; prompt: string; savedAt: string };

const presets = [
  ["⚡ Physics Diagram", "Create a clean, accurate educational diagram for a Class 12 Physics concept. Use clear labels, simple shapes, textbook-style presentation."],
  ["🧠 Concept Map", "Create a student-friendly concept map for this topic. Organize the main idea, key formulas, relationships and examples clearly."],
  ["📚 Project Visual", "Create a polished educational illustration for a school science project. Make it realistic, clean, labelled and suitable for a Class 12 project."],
  ["📝 Infographic", "Create a clean educational infographic for a student. Use concise labels, readable typography, logical sections and a premium study-app visual style."],
];

const SAVED_KEY = "lakshya_ai_saved_images";

export default function ImageAIPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [saved, setSaved] = useState(false);
  const [imageProvider, setImageProvider] = useState<"lakshya" | "qwen" | "flux" | "stable" | "pollinations">("lakshya");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSavedImages(JSON.parse(raw));
    } catch { /* ignore unavailable/corrupt local storage */ }
  }, []);

  function persistSaved(next: SavedImage[]) {
    setSavedImages(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { setError("Could not save this image on this device. Try Download instead."); }
  }

  function saveImage() {
    if (!image) return;
    const item: SavedImage = { id: `${Date.now()}`, image, prompt: prompt.trim() || "Lakshya study image", savedAt: new Date().toISOString() };
    const next = [item, ...savedImages.filter((x) => x.image !== image)].slice(0, 12);
    persistSaved(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function removeSaved(id: string) {
    persistSaved(savedImages.filter((x) => x.id !== id));
  }

  async function generate(event?: FormEvent) {
    event?.preventDefault();
    const value = prompt.trim();
    if (!value || loading) return;
    setLoading(true);
    setError("");
    setImage("");
    setSaved(false);
    try {
      const response = await fetch(\
        imageProvider === "qwen" ? "/api/ai/qwen-image" : imageProvider === "flux" ? "/api/ai/huggingface-image" : imageProvider === "stable" ? "/api/ai/stable-diffusion" : imageProvider === "pollinations" ? "/api/ai/pollinations-image" : "/api/ai/image",\
        {
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
    <main className="page lakshya-image-page">
      <section className="image-hero">
        <div className="image-orbit orbit-one" />
        <div className="image-orbit orbit-two" />
        <div className="image-hero-copy">
          <div className="image-kicker"><span className="spark">✦</span> LAKSHYA · IMAGE STUDIO</div>
          <h1>Create anything you need<br /><span>for your studies.</span></h1>
          <p>Describe a diagram, concept map, project visual or infographic. Lakshya turns your idea into a study-ready image.</p>
        </div>
        <Link className="image-back" href="/ai">← Back to AI</Link>
      </section>

      <section className="image-create-card panel">
        <div className="create-head">
          <div><span className="section-eyebrow">CREATE IMAGE</span><h2>What do you want to see?</h2></div>
          <div className="image-provider-tabs" role="tablist" aria-label="Image AI">
            <button type="button" role="tab" aria-selected={imageProvider === "lakshya"} className={imageProvider === "lakshya" ? "active" : ""} onClick={() => setImageProvider("lakshya")} disabled={loading}>✦ Lakshya Image</button>
            <button type="button" role="tab" aria-selected={imageProvider === "qwen"} className={imageProvider === "qwen" ? "active qwen" : "qwen"} onClick={() => setImageProvider("qwen")} disabled={loading}>◉ Qwen Image AI</button>
            <button type="button" role="tab" aria-selected={imageProvider === "flux"} className={imageProvider === "flux" ? "active flux" : "flux"} onClick={() => setImageProvider("flux")} disabled={loading}>⚡ Hugging Face FLUX</button>\
            <button type="button" role="tab" aria-selected={imageProvider === "stable"} className={imageProvider === "stable" ? "active stable" : "stable"} onClick={() => setImageProvider("stable")} disabled={loading}>◈ Stable Diffusion 3.5</button>\
            <button type="button" role="tab" aria-selected={imageProvider === "pollinations"} className={imageProvider === "pollinations" ? "active pollinations" : "pollinations"} onClick={() => setImageProvider("pollinations")} disabled={loading}>✺ Pollinations AI</button>
          </div>
        </div>

        <div className="image-presets">
          {presets.map(([label, text]) => (
            <button key={label} className="image-preset" type="button" onClick={() => setPrompt(text)} disabled={loading}>
              <span>{label}</span><small>Use template</small>
            </button>
          ))}
        </div>

        <form onSubmit={generate} className="image-form">
          <div className={`prompt-shell ${loading ? "is-loading" : ""}`}>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={2000} rows={4} placeholder="Describe the image you want… e.g. A labelled Class 12 Physics electric circuit showing a cell, resistor, switch and ammeter." disabled={loading} />
            {loading && <div className="prompt-shimmer" />}
          </div>
          <div className="image-form-foot">
            <span>{prompt.length}/2000 · {imageProvider === "qwen" ? "Qwen Image 3 via OpenRouter" : imageProvider === "flux" ? "FLUX.1-schnell via Hugging Face" : imageProvider === "stable" ? "Stable Diffusion 3.5 via Hugging Face" : imageProvider === "pollinations" ? "Pollinations AI" : "Educational image generation"}</span>
            <button className="generate-image-btn" type="submit" disabled={!prompt.trim() || loading}>
              <span className="btn-spark">✦</span>{loading ? "Creating…" : "Create Image"}<span className="btn-arrow">→</span>
            </button>
          </div>
        </form>
      </section>

      {error && <section className="ai-error image-error" role="alert">{error}</section>}

      <section className={`image-result panel ${loading ? "generating" : ""} ${image ? "has-image" : ""}`}>
        {loading ? (
          <div className="generation-state" aria-live="polite">
            <div className="generation-logo"><span>✦</span></div>
            <div className="generation-rings"><i /><i /><i /></div>
            <h2>Creating your image</h2>
            <p>Preparing composition, labels and visual details…</p>
            <div className="thinking-bar"><span /></div>
          </div>
        ) : image ? (
          <div className="result-content">
            <div className="result-top"><div><span className="section-eyebrow">GENERATED IMAGE</span><h2>Your study visual is ready</h2></div><span className="ready-pill">● Ready</span></div>
            <div className="image-frame"><img src={image} alt="AI generated study visual" /></div>
            <div className="result-actions">
              <a className="result-btn result-primary" href={image} download="lakshya-study-image.png">↓ Download</a>
              <button className={`result-btn ${saved ? "saved-btn" : ""}`} type="button" onClick={saveImage}>{saved ? "✓ Saved to Lakshya" : "♡ Save to Lakshya"}</button>
              <button className="result-btn" type="button" onClick={() => void generate()}>↻ Regenerate</button>
              <Link className="result-btn" href="/ai">Ask AI about it →</Link>
            </div>
            <p className="save-hint">Save keeps a copy on this device in Lakshya. Download saves the image to your device.</p>
          </div>
        ) : (
          <div className="empty-image-state">
            <div className="empty-glow"><span>✦</span></div>
            <h2>Your image will appear here</h2>
            <p>Write what you want above and tap <b>Create Image</b>. Your generated visual will open in this workspace.</p>
          </div>
        )}
      </section>

      {savedImages.length > 0 && (
        <section className="saved-section panel">
          <div className="saved-head"><div><span className="section-eyebrow">YOUR LIBRARY</span><h2>Saved AI images</h2></div><span>{savedImages.length}/12 saved</span></div>
          <div className="saved-grid">
            {savedImages.map((item) => (
              <article className="saved-card" key={item.id}>
                <img src={item.image} alt="Saved Lakshya AI image" />
                <div className="saved-card-foot"><span title={item.prompt}>{item.prompt}</span><button type="button" onClick={() => removeSaved(item.id)} aria-label="Remove saved image">×</button></div>
                <a href={item.image} download="lakshya-saved-study-image.png" className="saved-download">↓ Download</a>
              </article>
            ))}
          </div>
        </section>
      )}

      <p className="image-note">Lakshya Image Studio · Built for Lakshya study workflows</p>

      <style jsx>{`
        .lakshya-image-page{max-width:1180px;overflow:hidden}
        .image-provider-tabs{display:flex;gap:6px;align-items:center;padding:4px;border:1px solid rgba(105,88,175,.12);border-radius:14px;background:rgba(247,244,255,.78)}
        .image-provider-tabs button{border:0;border-radius:10px;padding:8px 11px;background:transparent;color:#777184;font-size:9px;font-weight:900;cursor:pointer;white-space:nowrap}
        .image-provider-tabs button.active{background:linear-gradient(135deg,#705cf5,#df4eb5);color:#fff;box-shadow:0 7px 18px rgba(105,80,225,.16)}
        .image-provider-tabs button.qwen.active{background:linear-gradient(135deg,#1677ff,#5b4df5)}.image-provider-tabs button.flux.active{background:linear-gradient(135deg,#ff7a18,#ef3f8f)}.image-provider-tabs button.stable.active{background:linear-gradient(135deg,#4f46e5,#0ea5e9)}.image-provider-tabs button.pollinations.active{background:linear-gradient(135deg,#0f766e,#14b8a6)}
        .image-provider-tabs button:disabled{opacity:.5;cursor:not-allowed}
        .image-hero{position:relative;min-height:270px;margin:0 0 14px;padding:34px 30px;border-radius:28px;overflow:hidden;background:radial-gradient(circle at 78% 25%,rgba(168,85,247,.22),transparent 30%),radial-gradient(circle at 25% 80%,rgba(109,93,252,.13),transparent 34%),linear-gradient(135deg,#101322,#1b1630 58%,#21163a);color:#fff;box-shadow:0 22px 60px rgba(38,25,80,.2)}
        .image-hero-copy{position:relative;z-index:2;max-width:720px}.image-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;opacity:.78}.spark{display:inline-grid;place-items:center;width:24px;height:24px;margin-right:7px;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#d946ef);box-shadow:0 0 24px rgba(217,70,239,.45)}
        .image-hero h1{font-size:clamp(34px,6vw,68px);line-height:.98;letter-spacing:-.055em;margin:17px 0 13px}.image-hero h1 span{background:linear-gradient(90deg,#fff,#d8b4fe,#f0abfc);-webkit-background-clip:text;color:transparent}.image-hero p{max-width:610px;margin:0;color:rgba(255,255,255,.72);font-size:13px;line-height:1.7}.image-back{position:absolute;z-index:3;right:24px;top:22px;color:#fff;text-decoration:none;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);padding:10px 14px;border-radius:13px;font-size:11px;font-weight:800;backdrop-filter:blur(10px)}
        .image-orbit{position:absolute;border:1px solid rgba(255,255,255,.09);border-radius:50%;pointer-events:none}.orbit-one{width:360px;height:360px;right:-90px;top:-170px;animation:orbit 12s linear infinite}.orbit-two{width:220px;height:220px;right:35px;bottom:-125px;animation:orbit 9s linear infinite reverse}.image-orbit:after{content:"";position:absolute;width:7px;height:7px;right:12%;top:15%;border-radius:50%;background:#d946ef;box-shadow:0 0 18px #d946ef}
        .image-create-card{margin-top:14px;padding:22px;border-radius:22px}.create-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.create-head h2{margin:4px 0 0}.lakshya-pill{display:flex;align-items:center;gap:7px;border:1px solid #e6e3f2;border-radius:999px;padding:8px 11px;font-size:9px;font-weight:900;color:#66697a}.pulse-dot{width:7px;height:7px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 0 rgba(139,92,246,.4);animation:pulse 1.8s infinite}
        .image-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:18px 0 12px}.image-preset{border:1px solid #e8e6f0;background:linear-gradient(180deg,#fff,#fbfaff);border-radius:14px;padding:13px;text-align:left;cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.image-preset:hover{transform:translateY(-2px);border-color:#cfc7ff;box-shadow:0 10px 24px rgba(70,55,150,.08)}.image-preset span{display:block;font-size:11px;font-weight:900;color:#333546}.image-preset small{display:block;margin-top:5px;color:#9498a7;font-size:8px}.image-form{margin-top:8px}.prompt-shell{position:relative;border:1px solid #dfddec;border-radius:18px;background:#fbfaff;overflow:hidden;transition:border-color .25s,box-shadow .25s}.prompt-shell:focus-within{border-color:#8b5cf6;box-shadow:0 0 0 4px rgba(139,92,246,.08)}.prompt-shell textarea{display:block;width:100%;min-height:112px;box-sizing:border-box;resize:vertical;border:0;outline:0;background:transparent;padding:17px;font:inherit;font-size:13px;line-height:1.65;color:#292b3b}.prompt-shimmer{position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,transparent,#8b5cf6,#d946ef,transparent);background-size:200% 100%;animation:shimmer 1.2s linear infinite}.image-form-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px}.image-form-foot>span{font-size:9px;color:#9498a7}.generate-image-btn{display:flex;align-items:center;gap:9px;border:0;border-radius:13px;padding:12px 17px;background:linear-gradient(135deg,#6d5dfc,#b83df1);color:#fff;font-size:11px;font-weight:900;cursor:pointer;box-shadow:0 10px 25px rgba(109,93,252,.22);transition:transform .2s,box-shadow .2s}.generate-image-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 30px rgba(109,93,252,.3)}.generate-image-btn:disabled{opacity:.5;cursor:not-allowed}.btn-spark{font-size:14px}.btn-arrow{font-size:14px}
        .image-result{position:relative;min-height:390px;margin-top:14px;padding:22px;border-radius:22px;display:grid;place-items:center;overflow:hidden}.image-result.generating{background:radial-gradient(circle at 50% 42%,rgba(139,92,246,.11),transparent 30%),linear-gradient(180deg,#fff,#fbfaff)}.generation-state{text-align:center;position:relative}.generation-logo{position:relative;z-index:2;width:72px;height:72px;margin:0 auto 18px;display:grid;place-items:center;border-radius:24px;background:linear-gradient(135deg,#6d5dfc,#c43df2);color:#fff;font-size:31px;box-shadow:0 16px 45px rgba(109,93,252,.3);animation:float 2.2s ease-in-out infinite}.generation-rings{position:absolute;width:150px;height:150px;left:50%;top:-39px;transform:translateX(-50%);pointer-events:none}.generation-rings i{position:absolute;inset:0;border:1px solid rgba(109,93,252,.16);border-radius:50%;animation:ring 2.2s ease-out infinite}.generation-rings i:nth-child(2){animation-delay:.55s}.generation-rings i:nth-child(3){animation-delay:1.1s}.generation-state h2{margin:0 0 7px;font-size:20px}.generation-state p{margin:0;color:#8a8e9e;font-size:11px}.thinking-bar{width:min(300px,70vw);height:4px;margin:18px auto 0;border-radius:9px;background:#eceaf5;overflow:hidden}.thinking-bar span{display:block;width:45%;height:100%;border-radius:9px;background:linear-gradient(90deg,#6d5dfc,#d946ef);animation:progress 1.5s ease-in-out infinite}
        .result-content{width:100%}.result-top{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.result-top h2{margin:4px 0 0}.ready-pill{font-size:9px;font-weight:900;color:#4d7d5b;background:#effaf1;border:1px solid #d5efd9;padding:7px 10px;border-radius:999px}.image-frame{padding:8px;border-radius:19px;background:linear-gradient(135deg,#f4f1ff,#fff);border:1px solid #e6e2f3}.image-frame img{display:block;width:100%;max-height:700px;object-fit:contain;border-radius:14px}.result-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:13px}.result-btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border:1px solid #e2dfed;background:#fff;color:#3e4050;border-radius:11px;padding:10px 13px;font-size:10px;font-weight:900;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}.result-btn:hover{border-color:#bfb5ff;transform:translateY(-1px);box-shadow:0 7px 18px rgba(70,55,150,.07)}.result-primary{background:linear-gradient(135deg,#6d5dfc,#b83df1);border-color:transparent;color:#fff}.saved-btn{border-color:#b8e0c0;background:#f2fbf4;color:#397449}.save-hint{text-align:center;color:#9a9eac;font-size:8px;margin:9px 0 0}.empty-image-state{text-align:center;max-width:460px}.empty-glow{width:64px;height:64px;margin:0 auto 16px;display:grid;place-items:center;border-radius:21px;background:linear-gradient(135deg,#6d5dfc,#d946ef);color:#fff;font-size:27px;box-shadow:0 14px 38px rgba(109,93,252,.22);animation:float 3s ease-in-out infinite}.empty-image-state h2{margin:0 0 7px;font-size:20px}.empty-image-state p{margin:0;color:#8b8f9e;font-size:11px;line-height:1.7}
        .saved-section{margin-top:14px;padding:20px;border-radius:22px}.saved-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.saved-head h2{margin:4px 0 0}.saved-head>span{font-size:9px;color:#8f93a2;font-weight:800}.saved-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.saved-card{min-width:0;border:1px solid #e7e4ef;border-radius:15px;background:#fff;overflow:hidden;transition:transform .2s,box-shadow .2s}.saved-card:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(50,40,110,.08)}.saved-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;background:#faf9ff}.saved-card-foot{display:flex;align-items:center;gap:5px;padding:8px 9px 4px}.saved-card-foot span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:9px;font-weight:800;color:#414354}.saved-card-foot button{border:0;background:none;color:#9b6b72;font-size:17px;line-height:1;cursor:pointer}.saved-download{display:block;margin:0 9px 9px;padding:7px 8px;text-align:center;text-decoration:none;border:1px solid #e7e3ef;border-radius:8px;color:#5e55cf;font-size:8px;font-weight:900}.image-note{text-align:center;color:#9a9eac;font-size:8px;margin:12px 0 2px}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(139,92,246,.35)}70%{box-shadow:0 0 0 8px rgba(139,92,246,0)}100%{box-shadow:0 0 0 0 rgba(139,92,246,0)}}@keyframes ring{0%{transform:scale(.45);opacity:.8}100%{transform:scale(1.35);opacity:0}}@keyframes progress{0%{transform:translateX(-110%)}100%{transform:translateX(230%)}}@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes orbit{to{transform:rotate(360deg)}}
        @media(max-width:760px){.image-hero{min-height:330px;padding:28px 20px;border-radius:22px}.image-back{top:17px;right:17px}.image-hero h1{font-size:clamp(36px,12vw,54px);margin-top:45px}.image-create-card,.image-result,.saved-section{padding:16px;border-radius:18px}.image-presets{grid-template-columns:repeat(2,1fr)}.create-head{align-items:flex-start}.lakshya-pill{display:none}.image-form-foot{align-items:flex-end}.image-result{min-height:340px}.result-top{align-items:flex-start}.result-top h2{font-size:18px}.saved-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:430px){.image-presets{grid-template-columns:1fr 1fr;gap:7px}.image-preset{padding:11px 9px}.image-preset span{font-size:10px}.image-form-foot{flex-direction:column;align-items:stretch}.image-form-foot>span{max-width:none}.generate-image-btn{justify-content:center}.result-actions{display:grid;grid-template-columns:1fr 1fr}.result-btn:last-child{grid-column:1/-1}.saved-grid{gap:7px}}
      `}</style>
    </main>
  );
}
