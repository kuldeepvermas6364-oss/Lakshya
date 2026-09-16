"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type SavedImage = { id: string; image: string; prompt: string; savedAt: string };

export default function StudyImageAIPage() {
  const [subject, setSubject] = useState("Physics");
  const [chapter, setChapter] = useState("Electric Charges and Fields");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [library, setLibrary] = useState<SavedImage[]>([]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSubject(p.get("subject") || "Physics");
    setChapter(p.get("chapter") || "Electric Charges and Fields");
    try { const raw = localStorage.getItem("lakshya_study_ai_images"); if (raw) setLibrary(JSON.parse(raw)); } catch {}
  }, []);

  function saveImage() {
    if (!image) return;
    const item = { id: String(Date.now()), image, prompt: prompt.trim(), savedAt: new Date().toISOString() };
    const next = [item, ...library.filter(x => x.image !== image)].slice(0, 12);
    setLibrary(next); setSaved(true);
    try { localStorage.setItem("lakshya_study_ai_images", JSON.stringify(next)); } catch {}
    setTimeout(() => setSaved(false), 1600);
  }

  async function generate(e?: FormEvent) {
    e?.preventDefault();
    const userPrompt = prompt.trim();
    if (!userPrompt || loading) return;
    setLoading(true); setError(""); setImage(""); setSaved(false);
    const fullPrompt = `Create an accurate educational study visual for Class 12 ${subject}, chapter ${chapter}. ${userPrompt}. Use clear labels, scientifically correct relationships, clean readable composition, and original visuals. Do not reproduce copyrighted textbook pages.`;
    try {
      const res = await fetch("/api/ai/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: fullPrompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed.");
      setImage(data.image || "");
      if (!data.image) throw new Error("Image AI ने image return नहीं की।");
    } catch (err) { setError(err instanceof Error ? err.message : "Image AI अभी उपलब्ध नहीं है।"); }
    finally { setLoading(false); }
  }

  return <main className="page">
    <section className="hero"><Link href={`/study/ai-chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`} className="back">← Back to Chapter AI</Link><span className="kicker">✦ LAKSHYA STUDY • GEMINI IMAGE AI</span><h1>{chapter}</h1><p>{subject} के इसी chapter के लिए diagram, concept map, infographic या visual बनाएं। बाकी Study AI पहले वाले text/chat AI से ही चलेगा।</p></section>
    <section className="card"><div className="head"><div><span className="badge">CHAPTER IMAGE AI</span><h2>क्या visual बनाना है?</h2></div><span className="model">Gemini 3.1 Flash Image</span></div>
      <div className="chips"><button onClick={() => setPrompt("Create a clean labelled Physics diagram for this chapter with important components and arrows.")}>⚡ Diagram</button><button onClick={() => setPrompt("Create a clear concept map showing key concepts, formulas and relationships from this chapter.")}>🧠 Concept Map</button><button onClick={() => setPrompt("Create a premium exam-revision infographic with key formulas, definitions and common mistakes from this chapter.")}>📚 Revision Infographic</button><button onClick={() => setPrompt("Create a clean project-ready educational illustration related to this chapter.")}>📝 Project Visual</button></div>
      <form onSubmit={generate}><textarea value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={2000} rows={4} placeholder={`Example: Electric field lines around a positive and negative charge, clearly labelled…`} disabled={loading}/><div className="foot"><span>{prompt.length}/2000</span><button disabled={!prompt.trim() || loading}>{loading ? "✦ Creating…" : "✦ Create Study Image"}</button></div></form>
    </section>
    {error && <div className="error">{error}</div>}
    <section className={`card result ${loading ? "loading" : ""}`}>
      {loading ? <div className="thinking"><div>✦</div><h2>Image AI बना रहा है…</h2><p>Composition, labels और chapter context तैयार हो रहा है.</p><span className="bar"/></div> : image ? <><div className="resultHead"><div><span className="badge">GENERATED STUDY VISUAL</span><h2>Image ready</h2></div><span className="ready">● Ready</span></div><img className="generated" src={image} alt={`AI generated ${subject} ${chapter} study visual`}/><div className="actions"><a href={image} download={`lakshya-${subject}-${chapter}-study-image.png`}>↓ Download</a><button onClick={saveImage}>{saved ? "✓ Saved to Lakshya" : "♡ Save to Lakshya"}</button><button onClick={() => void generate()}>↻ Regenerate</button></div></> : <div className="empty"><div>✦</div><h2>Study visual यहाँ आएगा</h2><p>ऊपर prompt लिखकर Create Study Image दबाएं.</p></div>}
    </section>
    {library.length > 0 && <section className="card"><div className="resultHead"><div><span className="badge">THIS DEVICE</span><h2>Saved Study Images</h2></div><span>{library.length}/12</span></div><div className="grid">{library.map(item => <article key={item.id}><img src={item.image} alt="Saved study visual"/><small>{item.prompt}</small><a href={item.image} download="lakshya-saved-study-image.png">↓ Download</a></article>)}</div></section>}
    <style jsx>{`.page{min-height:100vh;max-width:1100px;margin:auto;padding:16px 14px 70px;background:linear-gradient(135deg,#f7f0ff,#eef8ff,#fff2fa);color:#24263a}.hero{padding:25px;border-radius:24px;background:linear-gradient(135deg,#251d59,#7047c9,#b747c9);color:#fff;box-shadow:0 20px 55px rgba(63,43,130,.18)}.back{display:inline-block;color:#fff;text-decoration:none;font-size:10px;font-weight:800;margin-bottom:22px}.kicker{display:block;font-size:9px;font-weight:900;letter-spacing:.15em;opacity:.78}.hero h1{font-size:32px;margin:9px 0}.hero p{font-size:11px;line-height:1.7;opacity:.84;max-width:760px}.card{background:rgba(255,255,255,.94);border:1px solid #e3e0ef;border-radius:20px;padding:19px;margin-top:13px;box-shadow:0 10px 30px rgba(50,45,100,.05)}.head,.resultHead{display:flex;justify-content:space-between;align-items:center;gap:10px}.badge{display:inline-block;padding:5px 8px;border-radius:7px;background:#eee9ff;color:#5a4cc3;font-size:8px;font-weight:900}.head h2,.resultHead h2{margin:7px 0 0;font-size:19px}.model{font-size:9px;font-weight:900;color:#666a7b;border:1px solid #e3e1ed;border-radius:999px;padding:8px 10px}.chips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:17px 0 12px}.chips button{border:1px solid #e4e1ef;background:#fbfaff;border-radius:12px;padding:11px 8px;text-align:left;font-size:9px;font-weight:900;color:#3d4052;cursor:pointer}.chips button:hover{border-color:#bdb2ff}.card form textarea{width:100%;box-sizing:border-box;border:1px solid #ddd9ec;border-radius:14px;padding:13px;font:inherit;font-size:11px;resize:vertical;outline:none;background:#fbfaff}.foot{display:flex;justify-content:space-between;align-items:center;margin-top:9px}.foot span{font-size:8px;color:#8c8f9e}.foot button,.actions a,.actions button{border:0;background:linear-gradient(135deg,#6654df,#b43de9);color:#fff;border-radius:11px;padding:11px 14px;font-size:9px;font-weight:900;text-decoration:none;cursor:pointer}.foot button:disabled{opacity:.5}.error{margin-top:12px;padding:11px;border-radius:12px;background:#fff0f2;color:#9a3e59;font-size:10px}.result{min-height:340px;display:flex;flex-direction:column;justify-content:center}.result.loading{background:radial-gradient(circle at 50% 35%,#f0eaff,transparent 40%),#fff}.ready{font-size:9px;color:#4e8a67;font-weight:900}.thinking{text-align:center}.thinking>div,.empty>div{width:64px;height:64px;margin:0 auto 15px;display:grid;place-items:center;border-radius:21px;background:linear-gradient(135deg,#6b57e5,#c53fe8);color:#fff;font-size:27px;box-shadow:0 15px 35px rgba(105,82,220,.25);animation:float 2s ease-in-out infinite}.thinking h2,.empty h2{margin:0 0 6px;font-size:19px}.thinking p,.empty p{font-size:10px;color:#85899a}.bar{display:block;width:min(300px,80%);height:4px;margin:17px auto 0;border-radius:9px;background:linear-gradient(90deg,#6b57e5,#d43ee8,#6b57e5);background-size:200%;animation:move 1.2s linear infinite}.generated{display:block;width:100%;max-height:680px;object-fit:contain;border-radius:15px;background:#faf9ff;margin-top:14px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.empty{text-align:center}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}.grid article{border:1px solid #e6e3ee;border-radius:13px;overflow:hidden;background:#fff}.grid img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}.grid small{display:block;padding:8px;font-size:8px;color:#6f7382;line-height:1.4;min-height:34px}.grid a{display:block;padding:8px;font-size:8px;font-weight:900;color:#5a4cc3;text-decoration:none}@keyframes float{50%{transform:translateY(-5px)}}@keyframes move{to{background-position:200%}}@media(max-width:700px){.page{padding:10px 9px 60px}.hero h1{font-size:25px}.head,.resultHead{align-items:flex-start}.model{font-size:8px}.chips{grid-template-columns:repeat(2,1fr)}.actions>*{flex:1;text-align:center}.grid{grid-template-columns:repeat(2,1fr)}}`}</style>
  </main>;
}
