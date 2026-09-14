"use client";

import { useMemo, useState } from "react";

const UPMSP = "https://upmsp.edu.in/Board_ModelPaper.aspx";
const UPMSP_QB = "https://upmsp.edu.in/Board_QuestionBank.aspx";
const JEE = "https://jeemain.nta.nic.in/";
const JEE_SITEMAP = "https://jeemain.nta.nic.in/sitemap/";

const upSubjects = [
  ["Physics / भौतिक विज्ञान", "151"],
  ["Chemistry / रसायन विज्ञान", "152"],
  ["Biology / जीव विज्ञान", "153"],
  ["Math / गणित", "131"],
  ["English / अंग्रेज़ी", "117"],
  ["Hindi / हिंदी", "101"],
];

const jeePapers = [
  "B.Tech 2 Apr 2026 — Shift 1",
  "B.Tech 2 Apr 2026 — Shift 2",
  "B.Tech 4 Apr 2026 — Shift 1",
  "B.Tech 4 Apr 2026 — Shift 2",
  "B.Tech 5 Apr 2026 — Shift 1",
  "B.Tech 5 Apr 2026 — Shift 2",
  "B.Tech 6 Apr 2026 — Shift 1",
  "B.Tech 6 Apr 2026 — Shift 2",
  "B.Tech 8 Apr 2026 — Shift 2",
];

export default function PYQPage() {
  const [source, setSource] = useState<"up" | "jee">("up");
  const [mode, setMode] = useState<"paper" | "mcq" | "short">("paper");
  const [text, setText] = useState("");
  const [count, setCount] = useState("10");
  const [notice, setNotice] = useState("");
  const selectedLabel = useMemo(() => source === "up" ? "UPMSP Board / यूपी बोर्ड" : "JEE Main / जेईई मेन", [source]);

  function makePrompt() {
    if (!text.trim()) {
      setNotice("पहले paper/question का text यहाँ paste करें / Paste the selected paper text first.");
      return;
    }
    const format = mode === "mcq" ? "MCQ with 4 options, correct answer and short explanation" : mode === "short" ? "short-answer questions with answer points" : "a complete practice paper with sections";
    const prompt = `You are Lakshya AI. From the following ${selectedLabel} source text, create ${count} ${format}. Keep the level faithful to the source. Do not invent official wording or claim that generated questions are official. Return clean Hindi + English bilingual formatting. Source text:\n\n${text.trim()}`;
    try {
      localStorage.setItem("lakshya_pyq_ai_prompt", prompt);
      window.location.href = "/ai?prefill=pyq";
    } catch {
      setNotice("AI prompt ready नहीं हो पाया. Please try again.");
    }
  }

  return <main className="pyq-page">
    <section className="hero">
      <p className="eyebrow">LAKSHYA • PYQ CENTER / पिछले वर्ष प्रश्न केंद्र</p>
      <h1>Official PYQ & Practice Lab / आधिकारिक PYQ और प्रैक्टिस लैब</h1>
      <p>UPMSP और JEE Main के official source pages से papers देखें. फिर चुने हुए text को Lakshya AI से MCQ, Short Questions या practice paper में बदलकर practice करें.</p>
    </section>

    <div className="source-tabs">
      <button className={source === "up" ? "active" : ""} onClick={() => setSource("up")}>🏫 UPMSP / यूपी बोर्ड</button>
      <button className={source === "jee" ? "active" : ""} onClick={() => setSource("jee")}>🎯 JEE Main / जेईई मेन</button>
    </div>

    {source === "up" ? <section className="panel">
      <div className="panel-head"><div><b>UPMSP Official Papers / यूपी बोर्ड आधिकारिक पेपर</b><span>Model Papers + Question Bank / मॉडल पेपर + प्रश्न बैंक</span></div><span className="official">OFFICIAL</span></div>
      <div className="cards">
        <a href={UPMSP} target="_blank" rel="noreferrer" className="paper-card"><strong>📄 Model Papers / मॉडल पेपर</strong><small>Class 9–12 • official board material</small><span>Open official page ↗</span></a>
        <a href={UPMSP_QB} target="_blank" rel="noreferrer" className="paper-card"><strong>📚 Question Bank / प्रश्न बैंक</strong><small>Board-published question banks</small><span>Open official page ↗</span></a>
      </div>
      <div className="subject-grid">{upSubjects.map(([name, code]) => <div className="subject-card" key={code}><b>{name}</b><small>Subject code {code}</small><a href={UPMSP} target="_blank" rel="noreferrer">Official source ↗</a></div>)}</div>
      <p className="source-note">UPMSP की official site पर उपलब्ध model papers/question banks से ही source links दिए गए हैं. Paper की official copy देखने के लिए source page खोलें.</p>
    </section> : <section className="panel">
      <div className="panel-head"><div><b>JEE Main Official Question Papers / आधिकारिक प्रश्नपत्र</b><span>NTA official question-paper links</span></div><span className="official">NTA OFFICIAL</span></div>
      <a href={JEE_SITEMAP} target="_blank" rel="noreferrer" className="big-link">🎯 Official JEE Main Question Papers / आधिकारिक प्रश्नपत्र <span>Open ↗</span></a>
      <div className="jee-list">{jeePapers.map(paper => <div className="jee-row" key={paper}><span>📑 {paper}</span><a href={JEE_SITEMAP} target="_blank" rel="noreferrer">View official source ↗</a></div>)}</div>
      <a href={JEE} target="_blank" rel="noreferrer" className="secondary-link">JEE Main official website / आधिकारिक वेबसाइट ↗</a>
    </section>}

    <section className="ai-lab">
      <div className="ai-title"><span>✦</span><div><b>Turn Paper into Practice / Paper को Practice में बदलें</b><small>Official paper से selected text paste करें, फिर अपना format चुनें.</small></div></div>
      <div className="mode-tabs">{([['paper','Full Paper / पूरा पेपर'],['mcq','MCQ / बहुविकल्पीय'],['short','Short Q / लघु प्रश्न']] as const).map(([key,label]) => <button key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{label}</button>)}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="यहाँ official paper से selected questions/text paste करें… / Paste selected questions or text from the official paper…" />
      <div className="ai-controls"><label>Questions / प्रश्न <select value={count} onChange={e => setCount(e.target.value)}><option>5</option><option>10</option><option>15</option><option>20</option></select></label><button onClick={makePrompt}>✦ Generate with Lakshya AI / AI से बनाएं</button></div>
      {notice && <p className="notice">{notice}</p>}
      <p className="tiny">AI-generated practice is clearly treated as generated practice, not as an official paper. / AI से बने प्रश्न official paper नहीं माने जाएंगे.</p>
    </section>

    <section className="how"><b>कैसे काम करेगा? / How it works</b><div><span>1</span>Official paper खोलें → <span>2</span> अपना selected text लें → <span>3</span> MCQ / Short / Full Practice चुनें → <span>4</span> Lakshya AI से practice बनाएं.</div></section>

    <style jsx>{` .pyq-page{max-width:1050px;margin:0 auto;padding:30px 28px 80px}.hero{padding:24px;border:1px solid #ded9ff;border-radius:22px;background:linear-gradient(120deg,#f8f7ff,#fff7fc);margin-bottom:16px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#635bff}.hero h1{font-size:31px;line-height:1.08;margin:8px 0;background:linear-gradient(100deg,#171a2b,#635bff,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}.hero p:last-child{font-size:12px;line-height:1.7;color:#707789}.source-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.source-tabs button,.mode-tabs button{border:1px solid #e2e4ec;background:#fff;border-radius:12px;padding:12px;font-weight:900;cursor:pointer}.source-tabs button.active,.mode-tabs button.active{background:#635bff;color:#fff;border-color:#635bff}.panel,.ai-lab,.how{border:1px solid #e2e4ec;border-radius:20px;background:#fff;padding:17px;margin-bottom:15px;box-shadow:0 8px 26px rgba(38,44,90,.05)}.panel-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:13px}.panel-head b,.panel-head span{display:block}.panel-head b{font-size:15px}.panel-head span:not(.official){font-size:9px;color:#8a91a0;margin-top:4px}.official{font-size:8px;font-weight:900;color:#635bff;background:#f0eeff;padding:6px 8px;border-radius:8px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.paper-card,.subject-card,.big-link{display:block;text-decoration:none;color:#202438;border:1px solid #e7e8ef;border-radius:14px;padding:13px;background:#fafaff}.paper-card strong,.paper-card small,.paper-card span{display:block}.paper-card small{font-size:9px;color:#8a91a0;margin:4px 0 8px}.paper-card span,.subject-card a{font-size:9px;color:#635bff;font-weight:900}.subject-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.subject-card b,.subject-card small,.subject-card a{display:block}.subject-card b{font-size:10px}.subject-card small{font-size:8px;color:#969cab;margin:4px 0 8px}.source-note,.tiny{font-size:8px;line-height:1.6;color:#8b92a1}.big-link{display:flex;justify-content:space-between;font-weight:900;background:#f8f7ff;border-color:#d8d2ff}.big-link span{color:#635bff}.jee-list{display:grid;gap:6px;margin:11px 0}.jee-row{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid #eceef3;border-radius:10px;font-size:9px}.jee-row a{color:#635bff;font-weight:900;text-decoration:none}.secondary-link{display:inline-block;color:#635bff;font-size:9px;font-weight:900;text-decoration:none}.ai-lab{background:linear-gradient(135deg,#17152f,#29234d);color:#fff;border-color:#41396d}.ai-title{display:flex;gap:10px;align-items:center}.ai-title>span{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#635bff;font-size:20px}.ai-title b,.ai-title small{display:block}.ai-title b{font-size:13px}.ai-title small{font-size:8px;color:#c9c7d8;margin-top:3px}.mode-tabs{display:flex;gap:6px;margin:13px 0}.mode-tabs button{font-size:9px;padding:9px;background:#ffffff12;color:#e8e7f2;border-color:#4a4370}.mode-tabs button.active{background:#635bff;color:#fff}.ai-lab textarea{width:100%;min-height:170px;resize:vertical;border:1px solid #514a76;border-radius:13px;background:#100e22;color:#fff;padding:12px;font:inherit;font-size:10px;outline:none}.ai-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}.ai-controls label{font-size:9px}.ai-controls select{margin-left:5px;border-radius:8px;padding:7px;background:#fff}.ai-controls button{border:0;border-radius:10px;background:#fff;color:#4e46c7;padding:10px 13px;font-weight:900;cursor:pointer}.notice{font-size:9px;color:#ffd7e8}.how{font-size:10px}.how>div{margin-top:8px;color:#737b8c;line-height:2}.how span{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#eeecff;color:#635bff;font-weight:900;margin:0 3px}@media(max-width:700px){.pyq-page{padding:20px 14px 90px}.hero h1{font-size:25px}.cards,.subject-grid{grid-template-columns:1fr}.source-tabs{position:sticky;top:8px;z-index:10;background:#f7f7fb;padding:4px;border-radius:14px}.ai-controls{align-items:stretch;flex-direction:column}.ai-controls button{width:100%}.jee-row{flex-direction:column;gap:5px}.mode-tabs{overflow:auto}.mode-tabs button{white-space:nowrap}}`}</style>
  </main>;
}
