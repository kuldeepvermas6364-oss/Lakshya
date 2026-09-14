"use client";

import { useMemo, useState } from "react";

const UPMSP = "https://upmsp.edu.in/Board_ModelPaper.aspx";
const UPMSP_QB = "https://upmsp.edu.in/Board_QuestionBank.aspx";
const JEE = "https://jeemain.nta.nic.in/";
const JEE_SITEMAP = "https://jeemain.nta.nic.in/sitemap/";

const upPapers = [
  { name: "Physics / भौतिक विज्ञान", code: "151", url: "https://upmsp.edu.in/Downloads/ModelPaper/class12/151-Physics.pdf" },
  { name: "Chemistry / रसायन विज्ञान", code: "152", url: "https://upmsp.edu.in/Downloads/ModelPaper/class12/152-Chemistry.pdf" },
  { name: "Biology / जीव विज्ञान", code: "153", url: "https://upmsp.edu.in/Downloads/ModelPaper/class12/153-Biology.pdf" },
  { name: "Math / गणित", code: "131", url: UPMSP },
  { name: "English / अंग्रेज़ी", code: "117", url: UPMSP },
  { name: "Hindi / हिंदी", code: "101", url: UPMSP },
];

const jeePapers = [
  { name: "B.Tech 2 Apr 2026 — Shift 1", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/202604092096865379.pdf" },
  { name: "B.Tech 2 Apr 2026 — Shift 2", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409481957146.pdf" },
  { name: "B.Tech 4 Apr 2026 — Shift 1", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/202604091916616339.pdf" },
  { name: "B.Tech 4 Apr 2026 — Shift 2", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409432593766.pdf" },
  { name: "B.Tech 5 Apr 2026 — Shift 1", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409828731207.pdf" },
  { name: "B.Tech 5 Apr 2026 — Shift 2", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409829414602.pdf" },
  { name: "B.Tech 6 Apr 2026 — Shift 1", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/202604092007095665.pdf" },
  { name: "B.Tech 6 Apr 2026 — Shift 2", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409725707538.pdf" },
  { name: "B.Tech 8 Apr 2026 — Shift 2", url: "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409932754345.pdf" },
];

export default function PYQPage() {
  const [source, setSource] = useState<"up" | "jee">("up");
  const [mode, setMode] = useState<"paper" | "mcq" | "short">("paper");
  const [selectedUrl, setSelectedUrl] = useState(upPapers[0].url);
  const [selectedName, setSelectedName] = useState(upPapers[0].name);
  const [text, setText] = useState("");
  const [count, setCount] = useState("10");
  const [notice, setNotice] = useState("");
  const selectedLabel = useMemo(() => source === "up" ? "UPMSP Board / यूपी बोर्ड" : "JEE Main / जेईई मेन", [source]);

  function chooseSource(next: "up" | "jee") {
    setSource(next);
    const first = next === "up" ? upPapers[0] : jeePapers[0];
    setSelectedUrl(first.url); setSelectedName(first.name); setMode("paper");
  }

  function makePrompt() {
    if (!text.trim()) {
      setNotice("पहले paper/question का text यहाँ paste करें / Paste the selected paper text first.");
      return;
    }
    const format = mode === "mcq" ? "MCQ with 4 options, correct answer and short explanation" : mode === "short" ? "short-answer questions with answer points" : "a complete practice paper with sections";
    const prompt = `You are Lakshya AI. From the following ${selectedLabel} source text, create ${count} ${format}. Keep the level faithful to the source. Do not invent official wording or claim that generated questions are official. Return clean Hindi + English bilingual formatting. Source paper: ${selectedName}. Source text:\n\n${text.trim()}`;
    try {
      localStorage.setItem("lakshya_pyq_ai_prompt", prompt);
      window.location.href = "/ai?prefill=pyq";
    } catch { setNotice("AI prompt ready नहीं हो पाया. Please try again."); }
  }

  const paperList = source === "up" ? upPapers : jeePapers;

  return <main className="pyq-page">
    <section className="hero">
      <p className="eyebrow">LAKSHYA • PYQ CENTER / पिछले वर्ष प्रश्न केंद्र</p>
      <h1>Official PYQ & Practice Lab / आधिकारिक PYQ और प्रैक्टिस लैब</h1>
      <p>UPMSP और JEE Main के official source papers देखें. Full paper को यहीं पढ़ें, फिर selected questions/text को Lakshya AI से MCQ, Short Questions या नया practice paper बनाएं.</p>
    </section>

    <div className="source-tabs">
      <button className={source === "up" ? "active" : ""} onClick={() => chooseSource("up")}>🏫 UPMSP / यूपी बोर्ड</button>
      <button className={source === "jee" ? "active" : ""} onClick={() => chooseSource("jee")}>🎯 JEE Main / जेईई मेन</button>
    </div>

    <section className="panel">
      <div className="panel-head"><div><b>{source === "up" ? "UPMSP Official Papers / यूपी बोर्ड आधिकारिक पेपर" : "JEE Main Official Question Papers / आधिकारिक प्रश्नपत्र"}</b><span>{source === "up" ? "Model Papers + Question Bank / मॉडल पेपर + प्रश्न बैंक" : "NTA official question-paper PDFs / NTA के official प्रश्नपत्र"}</span></div><span className="official">{source === "up" ? "UPMSP OFFICIAL" : "NTA OFFICIAL"}</span></div>
      <div className="cards">
        <a href={source === "up" ? UPMSP : JEE_SITEMAP} target="_blank" rel="noreferrer" className="paper-card"><strong>📄 Official Library / आधिकारिक लाइब्रेरी</strong><small>{source === "up" ? "Model Papers + Question Bank" : "Question Papers + Archive"}</small><span>Open official source ↗</span></a>
        <a href={source === "up" ? UPMSP_QB : JEE} target="_blank" rel="noreferrer" className="paper-card"><strong>📚 More Papers / और पेपर</strong><small>{source === "up" ? "Board question bank" : "JEE Main official website"}</small><span>Open official source ↗</span></a>
      </div>
      <div className="paper-picker">{paperList.map(paper => <button key={paper.name} className={selectedName === paper.name ? "selected" : ""} onClick={() => { setSelectedName(paper.name); setSelectedUrl(paper.url); setMode("paper"); }}><b>📑 {paper.name}</b><small>{"code" in paper ? `Code ${paper.code}` : "Official PDF"}</small></button>)}</div>
    </section>

    <section className="viewer-panel">
      <div className="viewer-head"><div><b>{selectedName}</b><small>Official source / आधिकारिक source</small></div><a href={selectedUrl} target="_blank" rel="noreferrer">Open PDF ↗</a></div>
      <div className="viewer"><iframe src={selectedUrl} title={selectedName} /></div>
      <p className="source-note">अगर mobile/browser official PDF को embedded view में block करे, ऊपर <b>Open PDF</b> दबाकर पूरा paper खोलें. / If the official PDF blocks embedding, use Open PDF.</p>
    </section>

    <section className="ai-lab">
      <div className="ai-title"><span>✦</span><div><b>Turn Paper into Practice / Paper को Practice में बदलें</b><small>Paper से selected questions/text paste करें, फिर अपना format चुनें.</small></div></div>
      <div className="mode-tabs">{([['paper','Full Practice / पूरा Practice'],['mcq','MCQ / बहुविकल्पीय'],['short','Short Q / लघु प्रश्न']] as const).map(([key,label]) => <button key={key} className={mode === key ? "active" : ""} onClick={() => setMode(key)}>{label}</button>)}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Official PDF से selected questions/text paste करें… / Paste selected questions or text from the official PDF…" />
      <div className="ai-controls"><label>Questions / प्रश्न <select value={count} onChange={e => setCount(e.target.value)}><option>5</option><option>10</option><option>15</option><option>20</option></select></label><button onClick={makePrompt}>✦ Generate with Lakshya AI / AI से बनाएं</button></div>
      {notice && <p className="notice">{notice}</p>}
      <p className="tiny">Generated practice is clearly marked as AI-generated, not official. / AI से बने प्रश्न official paper नहीं माने जाएंगे.</p>
    </section>

    <section className="how"><b>कैसे काम करेगा? / How it works</b><div><span>1</span>Official paper खोलें → <span>2</span> Full paper देखें → <span>3</span> MCQ / Short चुनें → <span>4</span> selected text paste करें → <span>5</span> Lakshya AI से practice बनाएं.</div></section>

    <style jsx>{` .pyq-page{max-width:1050px;margin:0 auto;padding:30px 28px 80px}.hero{padding:24px;border:1px solid #ded9ff;border-radius:22px;background:linear-gradient(120deg,#f8f7ff,#fff7fc);margin-bottom:16px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#635bff}.hero h1{font-size:31px;line-height:1.08;margin:8px 0;background:linear-gradient(100deg,#171a2b,#635bff,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}.hero p:last-child{font-size:12px;line-height:1.7;color:#707789}.source-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.source-tabs button,.mode-tabs button{border:1px solid #e2e4ec;background:#fff;border-radius:12px;padding:12px;font-weight:900;cursor:pointer}.source-tabs button.active,.mode-tabs button.active{background:#635bff;color:#fff;border-color:#635bff}.panel,.viewer-panel,.ai-lab,.how{border:1px solid #e2e4ec;border-radius:20px;background:#fff;padding:17px;margin-bottom:15px;box-shadow:0 8px 26px rgba(38,44,90,.05)}.panel-head,.viewer-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:13px}.panel-head b,.panel-head span,.viewer-head b,.viewer-head small{display:block}.panel-head b,.viewer-head b{font-size:15px}.panel-head span:not(.official),.viewer-head small{font-size:9px;color:#8a91a0;margin-top:4px}.official{font-size:8px;font-weight:900;color:#635bff;background:#f0eeff;padding:6px 8px;border-radius:8px}.cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.paper-card{display:block;text-decoration:none;color:#202438;border:1px solid #e7e8ef;border-radius:14px;padding:13px;background:#fafaff}.paper-card strong,.paper-card small,.paper-card span{display:block}.paper-card small{font-size:9px;color:#8a91a0;margin:4px 0 8px}.paper-card span{font-size:9px;color:#635bff;font-weight:900}.paper-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.paper-picker button{text-align:left;border:1px solid #e8e9f0;background:#fff;border-radius:11px;padding:9px;cursor:pointer}.paper-picker button.selected{border-color:#635bff;background:#f7f5ff;box-shadow:0 0 0 2px #eeecff}.paper-picker b,.paper-picker small{display:block}.paper-picker b{font-size:9px}.paper-picker small{font-size:7px;color:#969cab;margin-top:4px}.viewer-head a{font-size:9px;color:#635bff;font-weight:900;text-decoration:none}.viewer{height:640px;border:1px solid #e6e7ee;border-radius:13px;overflow:hidden;background:#f1f1f5}.viewer iframe{width:100%;height:100%;border:0}.source-note,.tiny{font-size:8px;line-height:1.6;color:#8b92a1}.ai-lab{background:linear-gradient(135deg,#17152f,#29234d);color:#fff;border-color:#41396d}.ai-title{display:flex;gap:10px;align-items:center}.ai-title>span{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#635bff;font-size:20px}.ai-title b,.ai-title small{display:block}.ai-title b{font-size:13px}.ai-title small{font-size:8px;color:#c9c7d8;margin-top:3px}.mode-tabs{display:flex;gap:6px;margin:13px 0}.mode-tabs button{font-size:9px;padding:9px;background:#ffffff12;color:#e8e7f2;border-color:#4a4370}.mode-tabs button.active{background:#635bff;color:#fff}.ai-lab textarea{width:100%;min-height:170px;resize:vertical;border:1px solid #514a76;border-radius:13px;background:#100e22;color:#fff;padding:12px;font:inherit;font-size:10px;outline:none}.ai-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}.ai-controls label{font-size:9px}.ai-controls select{margin-left:5px;border-radius:8px;padding:7px;background:#fff}.ai-controls button{border:0;border-radius:10px;background:#fff;color:#4e46c7;padding:10px 13px;font-weight:900;cursor:pointer}.notice{font-size:9px;color:#ffd7e8}.how{font-size:10px}.how>div{margin-top:8px;color:#737b8c;line-height:2}.how span{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#eeecff;color:#635bff;font-weight:900;margin:0 3px}@media(max-width:700px){.pyq-page{padding:20px 14px 90px}.hero h1{font-size:25px}.cards,.paper-picker{grid-template-columns:1fr}.source-tabs{position:sticky;top:8px;z-index:10;background:#f7f7fb;padding:4px;border-radius:14px}.viewer{height:520px}.ai-controls{align-items:stretch;flex-direction:column}.ai-controls button{width:100%}.mode-tabs{overflow:auto}.mode-tabs button{white-space:nowrap}.viewer-head{align-items:center}}`}</style>
  </main>;
}
