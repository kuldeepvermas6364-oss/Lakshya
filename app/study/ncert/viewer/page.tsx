"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const chapterSets: Record<string, string[]> = {
  Physics: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
  Chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
  Biology: ["Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Ecology and Environment"],
};

function pdfFor(subject: string, chapter: string) {
  const chapters = chapterSets[subject] || [];
  const index = Math.max(0, chapters.indexOf(chapter));
  if (subject === "Physics") return `https://www.ncert.nic.in/textbook/pdf/${index < 7 ? "keph" : "leph"}${index < 7 ? index + 1 : index - 6}01.pdf`;
  if (subject === "Chemistry") return `https://www.ncert.nic.in/textbook/pdf/${index < 5 ? "kech" : "lech"}${index < 5 ? index + 1 : index - 4}01.pdf`;
  return `https://www.ncert.nic.in/textbook/pdf/lebo1${index + 1}01.pdf`;
}

export default function NcertViewerPage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [subject] = useState(params?.get("subject") || "Physics");
  const [chapter, setChapter] = useState(params?.get("chapter") || chapterSets[subject]?.[0] || "Electric Charges and Fields");
  const [selectedText, setSelectedText] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const chapters = chapterSets[subject] || chapterSets.Physics;
  const index = chapters.indexOf(chapter);
  const pdfUrl = useMemo(() => pdfFor(subject, chapter), [subject, chapter]);

  async function explainText() {
    if (!selectedText.trim() || loading) return;
    setLoading(true); setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        message: `Explain the following selected NCERT text from Class 12 ${subject}, chapter ${chapter}. Do not reproduce it unnecessarily. Explain it in simple student-friendly language, define difficult terms, and add a small example if useful. Keep formulas readable and never use raw LaTeX.\n\nSelected text:\n${selectedText}`,
        context: `Lakshya NCERT reader. Official NCERT source: ${pdfUrl}`,
      }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setAnswer(typeof data.text === "string" ? data.text : "No explanation returned.");
    } catch (e) { setAnswer(e instanceof Error ? e.message : "AI is temporarily unavailable."); }
    finally { setLoading(false); }
  }

  function goTo(ch: string) {
    setChapter(ch); setAnswer(""); setSelectedText("");
    window.history.replaceState({}, "", `/study/ncert/viewer?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(ch)}`);
  }

  return <main className="reader">
    <header className="top"><Link href={`/study/chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`}>← Chapter Workspace</Link><div><span>LAKSHYA • NCERT READER</span><h1>{chapter}</h1><p>{subject} · Official NCERT PDF · Chapter {index + 1}</p></div><a href={pdfUrl} target="_blank" rel="noreferrer">Open PDF ↗</a></header>
    <div className="layout">
      <aside className="chapters"><b>Chapter Navigation</b>{chapters.map((ch, i) => <button key={ch} className={ch === chapter ? "active" : ""} onClick={() => goTo(ch)}><span>{i + 1}</span>{ch}</button>)}</aside>
      <section className="main">
        <div className="toolbar"><button disabled={index <= 0} onClick={() => goTo(chapters[index - 1])}>← Previous</button><span>Official NCERT source</span><button disabled={index === chapters.length - 1} onClick={() => goTo(chapters[index + 1])}>Next →</button></div>
        <div className="pdf"><iframe title={`NCERT ${chapter}`} src={pdfUrl} /></div>
        <section className="aiBox"><span className="badge">✦ AI TEXT EXPLAINER</span><h2>Select → paste → understand</h2><p>NCERT PDF official source par hi rahega. PDF me passage select karke copy karo, yahan paste karo, aur Lakshya AI usse simple language me explain karega.</p><textarea value={selectedText} onChange={e => setSelectedText(e.target.value)} placeholder="Paste the NCERT text you want explained…"/><button className="explain" disabled={!selectedText.trim() || loading} onClick={() => void explainText()}>{loading ? "Explaining…" : "✦ Explain with Lakshya AI"}</button>{answer && <div className="answer"><b>AI Explanation</b><div>{answer}</div></div>}</section>
      </section>
    </div>
    <style jsx>{`body{background:#f5f6fa}.reader{max-width:1280px;margin:auto;padding:20px 18px 60px;color:#171a2b}.top{display:flex;gap:16px;align-items:flex-start;margin-bottom:14px}.top>a:first-child{color:#687082;text-decoration:none;font-size:10px;font-weight:800}.top>div{flex:1}.top span{font-size:8px;letter-spacing:.16em;color:#8e95a4;font-weight:900}.top h1{font-size:25px;margin:5px 0}.top p{font-size:9px;color:#8a91a0;margin:0}.top>a:last-child{background:#1b1d2b;color:#fff;text-decoration:none;padding:9px 12px;border-radius:8px;font-size:9px;font-weight:800}.layout{display:grid;grid-template-columns:230px 1fr;gap:12px}.chapters,.main,.aiBox{background:#fff;border:1px solid #e2e5ed;border-radius:14px}.chapters{padding:11px;align-self:start;position:sticky;top:12px;max-height:calc(100vh - 30px);overflow:auto}.chapters>b{font-size:10px;display:block;margin:3px 4px 9px}.chapters button{display:flex;gap:8px;width:100%;text-align:left;border:0;background:transparent;border-radius:8px;padding:8px 6px;font-size:8px;line-height:1.35;color:#626a7a;cursor:pointer}.chapters button span{width:16px;font-weight:900;color:#a0a6b2}.chapters button.active{background:#f0efff;color:#5149c7;font-weight:800}.main{padding:10px}.toolbar{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 9px}.toolbar button{border:1px solid #dfe2ea;background:#fff;border-radius:8px;padding:7px 9px;font-size:8px;font-weight:800}.toolbar span{font-size:8px;color:#9299a8}.pdf{height:720px;border:1px solid #e5e7ee;border-radius:10px;overflow:hidden;background:#eef0f4}.pdf iframe{width:100%;height:100%;border:0}.aiBox{margin-top:12px;padding:15px}.badge{display:inline-block;background:#f0efff;color:#6258df;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:900;letter-spacing:.1em}.aiBox h2{font-size:18px;margin:8px 0 5px}.aiBox p{font-size:9px;line-height:1.6;color:#7f8796;margin:0}.aiBox textarea{width:100%;box-sizing:border-box;min-height:105px;margin-top:10px;border:1px solid #dfe2ea;border-radius:9px;padding:10px;font:inherit;font-size:9px;line-height:1.55;resize:vertical}.explain{margin-top:8px;background:#1b1d2b;color:#fff;border:0;border-radius:8px;padding:9px 12px;font-size:9px;font-weight:800}.explain:disabled{opacity:.5}.answer{margin-top:12px;padding:12px;background:#faf9ff;border:1px solid #e2defc;border-radius:9px;font-size:9px;line-height:1.65;white-space:pre-wrap}.answer b{display:block;margin-bottom:6px;font-size:10px}@media(max-width:850px){.layout{grid-template-columns:1fr}.chapters{position:static;max-height:210px;display:grid;grid-template-columns:1fr 1fr;gap:2px}.chapters>b{grid-column:1/-1}.pdf{height:620px}}@media(max-width:560px){.reader{padding:16px 10px 50px}.top{flex-wrap:wrap}.top>div{min-width:60%}.top>a:last-child{margin-left:auto}.chapters{grid-template-columns:1fr}.pdf{height:520px}.toolbar span{display:none}}`}</style>
  </main>;
}
