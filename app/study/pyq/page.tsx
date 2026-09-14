"use client";

import { useMemo, useState } from "react";

const UPMSP = "https://upmsp.edu.in/Board_ModelPaper.aspx";
const UPMSP_QB = "https://upmsp.edu.in/Board_QuestionBank.aspx";
const JEE = "https://jeemain.nta.nic.in/";
const JEE_SITEMAP = "https://jeemain.nta.nic.in/sitemap/";

const YEARS = Array.from({ length: 12 }, (_, i) => String(2026 - i));
const SUBJECTS = [
  "Hindi / हिंदी",
  "English / अंग्रेज़ी",
  "Physics / भौतिक विज्ञान",
  "Chemistry / रसायन विज्ञान",
  "Maths / गणित",
];

const upOfficial: Record<string, string> = {
  "12|2026|Hindi / हिंदी": UPMSP,
  "12|2026|English / अंग्रेज़ी": UPMSP,
  "12|2026|Physics / भौतिक विज्ञान": "https://upmsp.edu.in/Downloads/ModelPaper/class12/151-Physics.pdf",
  "12|2026|Chemistry / रसायन विज्ञान": "https://upmsp.edu.in/Downloads/ModelPaper/class12/152-Chemistry.pdf",
  "12|2026|Maths / गणित": UPMSP,
  "10|2026|Hindi / हिंदी": UPMSP,
  "10|2026|English / अंग्रेज़ी": UPMSP,
  "10|2026|Physics / भौतिक विज्ञान": UPMSP,
  "10|2026|Chemistry / रसायन विज्ञान": UPMSP,
  "10|2026|Maths / गणित": UPMSP,
};

const jeePapers = [
  ["2 Apr 2026 — Shift 1", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/202604092096865379.pdf"],
  ["2 Apr 2026 — Shift 2", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409481957146.pdf"],
  ["4 Apr 2026 — Shift 1", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/202604091916616339.pdf"],
  ["4 Apr 2026 — Shift 2", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409432593766.pdf"],
  ["5 Apr 2026 — Shift 1", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409828731207.pdf"],
  ["5 Apr 2026 — Shift 2", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409829414602.pdf"],
  ["6 Apr 2026 — Shift 1", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/202604092007095665.pdf"],
  ["6 Apr 2026 — Shift 2", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c570b494ccdf/uploads/2026/04/20260409725707538.pdf"],
  ["8 Apr 2026 — Shift 2", "https://cdnbbsr.s3waas.gov.in/s3f8e59f4b2fe7c5705bf878bbd494ccdf/uploads/2026/04/20260409932754345.pdf"],
] as const;

export default function PYQPage() {
  const [source, setSource] = useState<"up" | "jee">("up");
  const [year, setYear] = useState("2025");
  const [grade, setGrade] = useState<"10" | "12">("12");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [mode, setMode] = useState<"paper" | "mcq" | "short">("paper");
  const [selectedUrl, setSelectedUrl] = useState(UPMSP_QB);
  const [selectedName, setSelectedName] = useState("UPMSP official archive");
  const [text, setText] = useState("");
  const [count, setCount] = useState("10");
  const [notice, setNotice] = useState("");

  const key = `${grade}|${year}|${subject}`;
  const boardUrl = upOfficial[key] || UPMSP_QB;
  const boardLabel = grade === "10" && (subject.startsWith("Physics") || subject.startsWith("Chemistry"))
    ? "Science / विज्ञान (Physics + Chemistry section)"
    : subject;

  const availability = useMemo(() => {
    if (source === "jee") return year === "2026" ? "Official 2026 shift PDFs available" : "Official NTA archive available";
    if (upOfficial[key]) return "Official UPMSP PDF verified";
    return "Official UPMSP archive / question bank";
  }, [source, year, key]);

  function applyBoardFilters(nextYear = year, nextGrade = grade, nextSubject = subject) {
    const nextKey = `${nextGrade}|${nextYear}|${nextSubject}`;
    const url = upOfficial[nextKey] || UPMSP_QB;
    setSelectedUrl(url);
    setSelectedName(`UPMSP Class ${nextGrade} • ${nextSubject} • ${nextYear}`);
    setNotice(upOfficial[nextKey]
      ? "Official UPMSP PDF verified for this selection."
      : "इस year/subject का stable direct PDF UPMSP की official site पर उपलब्ध नहीं मिला, इसलिए Lakshya official Question Bank/Model Paper library दिखा रहा है। कोई unofficial paper नहीं जोड़ा गया है।");
  }

  function changeSource(next: "up" | "jee") {
    setSource(next);
    setMode("paper");
    setNotice("");
    if (next === "jee") {
      setSelectedName("JEE Main official Question Paper Archive");
      setSelectedUrl(JEE_SITEMAP);
    } else {
      applyBoardFilters();
    }
  }

  function generateAI() {
    if (!text.trim()) {
      setNotice("पहले official paper से selected questions/text paste करें। / Paste selected questions or text first.");
      return;
    }
    const format = mode === "mcq"
      ? "MCQs with 4 options, correct answer and short explanation"
      : mode === "short"
        ? "short-answer questions with concise answer points"
        : "a complete practice paper with sections";
    const prompt = `You are Lakshya AI. Source: ${source === "up" ? "UPMSP" : "JEE Main"}. Selection: ${year}, ${source === "up" ? `Class ${grade}, ${boardLabel}` : "JEE Main"}. Create ${count} ${format}. Keep the same academic level and topic. Clearly label every generated question as AI-generated; never claim it is an official question. Return clean Hindi + English bilingual formatting. Source paper: ${selectedName}.\n\nSOURCE TEXT:\n${text.trim()}`;
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
      <h1>Year-wise PYQ Library / वर्ष के अनुसार PYQ</h1>
      <p>अब केवल गिने-चुने papers नहीं। <b>Year → Class → Subject</b> चुनो और official source खोलो। Hindi, English, Physics, Chemistry और Maths के लिए Class 10 तथा 12 selection दिया गया है।</p>
    </section>

    <div className="source-tabs">
      <button className={source === "up" ? "active" : ""} onClick={() => changeSource("up")}>🏫 UPMSP / यूपी बोर्ड</button>
      <button className={source === "jee" ? "active" : ""} onClick={() => changeSource("jee")}>🎯 JEE Main / जेईई मेन</button>
    </div>

    {source === "up" ? <section className="panel filters">
      <div className="panel-head"><div><b>Choose PYQ / अपना PYQ चुनें</b><span>Year-wise • Class-wise • Subject-wise</span></div><span className="official">OFFICIAL SOURCE</span></div>
      <div className="filter-grid">
        <label><span>Year / वर्ष</span><select value={year} onChange={e => { const v = e.target.value; setYear(v); applyBoardFilters(v, grade, subject); }}>{YEARS.map(y => <option key={y}>{y}</option>)}</select></label>
        <label><span>Class / कक्षा</span><select value={grade} onChange={e => { const v = e.target.value as "10" | "12"; setGrade(v); applyBoardFilters(year, v, subject); }}><option value="10">Class 10 / कक्षा 10</option><option value="12">Class 12 / कक्षा 12</option></select></label>
        <label className="subject"><span>Subject / विषय</span><select value={subject} onChange={e => { const v = e.target.value; setSubject(v); applyBoardFilters(year, grade, v); }}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></label>
      </div>
      {grade === "10" && (subject.startsWith("Physics") || subject.startsWith("Chemistry")) && <div className="info">ℹ️ UP Board Class 10 में Physics और Chemistry अलग board papers नहीं होते; Lakshya इन्हें official <b>Science / विज्ञान</b> paper के रूप में खोलेगा।</div>}
      <div className="status"><b>{availability}</b><span>{grade === "10" ? "Class 10" : "Class 12"} • {boardLabel} • {year}</span></div>
    </section> : <section className="panel filters">
      <div className="panel-head"><div><b>JEE Main Year / वर्ष चुनें</b><span>Official NTA archive</span></div><span className="official">NTA OFFICIAL</span></div>
      <label><span>Year / वर्ष</span><select value={year} onChange={e => { const v = e.target.value; setYear(v); setSelectedUrl(v === "2026" ? jeePapers[0][1] : JEE_SITEMAP); setSelectedName(v === "2026" ? `JEE Main ${jeePapers[0][0]}` : `JEE Main ${v} official archive`); }}>{YEARS.map(y => <option key={y}>{y}</option>)}</select></label>
      <p className="info">JEE Main में Lakshya year selector से official NTA archive खोलेगा। 2026 के verified shift PDFs नीचे मिलेंगे।</p>
    </section>}

    <section className="panel library">
      <div className="panel-head"><div><b>{source === "up" ? "Official UPMSP Library / आधिकारिक लाइब्रेरी" : "Official NTA Question Paper Archive / आधिकारिक लाइब्रेरी"}</b><span>{availability}</span></div><span className="official">OFFICIAL</span></div>
      <div className="cards">
        <a href={source === "up" ? UPMSP : JEE_SITEMAP} target="_blank" rel="noreferrer" className="paper-card"><strong>📚 Official Library / आधिकारिक लाइब्रेरी</strong><small>{source === "up" ? "Model Papers + Question Bank" : "Question Papers + Archive"}</small><span>Open official source ↗</span></a>
        <a href={source === "up" ? UPMSP_QB : JEE} target="_blank" rel="noreferrer" className="paper-card"><strong>🔎 More Papers / और पेपर</strong><small>{source === "up" ? "UPMSP Question Bank" : "NTA JEE Main website"}</small><span>Open official source ↗</span></a>
      </div>
      {source === "jee" && year === "2026" && <div className="shift-grid">{jeePapers.map(([name, url]) => <button key={name} className={selectedUrl === url ? "selected" : ""} onClick={() => { setSelectedUrl(url); setSelectedName(`JEE Main ${name}`); setMode("paper"); }}><b>📑 {name}</b><small>Official PDF</small></button>)}</div>}
    </section>

    <section className="viewer-panel">
      <div className="viewer-head"><div><b>{selectedName}</b><small>{source === "up" ? "UPMSP official source" : "NTA official source"}</small></div><a href={selectedUrl} target="_blank" rel="noreferrer">Open PDF / PDF खोलें ↗</a></div>
      <div className="viewer"><iframe src={selectedUrl} title={selectedName} /></div>
      <p className="source-note">अगर mobile/browser embedded PDF को block करे तो <b>Open PDF</b> दबाकर पूरा official paper खोलें। / Use Open PDF if embedding is blocked.</p>
      {notice && <p className="notice">{notice}</p>}
    </section>

    <section className="ai-lab">
      <div className="ai-title"><span>✦</span><div><b>Paper → MCQ / Short / Practice</b><small>Selected official-paper text को Lakshya AI से practice में बदलें।</small></div></div>
      <div className="mode-tabs">{([['paper','Full Practice / पूरा'],['mcq','MCQ / बहुविकल्पीय'],['short','Short Q / लघु प्रश्न']] as const).map(([k, l]) => <button key={k} className={mode === k ? "active" : ""} onClick={() => setMode(k)}>{l}</button>)}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Official PDF से चुने हुए questions/text यहाँ paste करें… / Paste selected questions or text…" />
      <div className="ai-controls"><label>Questions / प्रश्न <select value={count} onChange={e => setCount(e.target.value)}><option>5</option><option>10</option><option>15</option><option>20</option></select></label><button onClick={generateAI}>✦ Generate with Lakshya AI / AI से बनाएं</button></div>
      <p className="tiny">AI-generated questions clearly marked रहेंगे और official paper नहीं माने जाएंगे।</p>
    </section>

    <section className="how"><b>New flow / नया flow</b><div><span>1</span> Year → <span>2</span> Class → <span>3</span> Subject → <span>4</span> Full paper → <span>5</span> MCQ/Short → <span>6</span> Lakshya AI Practice.</div></section>

    <style jsx>{` .pyq-page{max-width:1080px;margin:0 auto;padding:30px 28px 90px}.hero{padding:24px;border:1px solid #ded9ff;border-radius:22px;background:linear-gradient(120deg,#f8f7ff,#fff7fc);margin-bottom:16px}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2px;color:#635bff}.hero h1{font-size:31px;line-height:1.08;margin:8px 0;background:linear-gradient(100deg,#171a2b,#635bff,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}.hero p:last-child{font-size:12px;line-height:1.7;color:#707789}.source-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.source-tabs button,.mode-tabs button{border:1px solid #e2e4ec;background:#fff;border-radius:12px;padding:12px;font-weight:900;cursor:pointer}.source-tabs button.active,.mode-tabs button.active{background:#635bff;color:#fff;border-color:#635bff}.panel,.viewer-panel,.ai-lab,.how{border:1px solid #e2e4ec;border-radius:20px;background:#fff;padding:17px;margin-bottom:15px;box-shadow:0 8px 26px rgba(38,44,90,.05)}.panel-head,.viewer-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:13px}.panel-head b,.viewer-head b{font-size:15px}.panel-head span:not(.official),.viewer-head small{display:block;font-size:9px;color:#8a91a0;margin-top:4px}.official{font-size:8px;font-weight:900;color:#635bff;background:#f0eeff;padding:6px 8px;border-radius:8px}.filter-grid{display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:10px}.filter-grid label span,.filters>label span{display:block;font-size:9px;font-weight:900;color:#737b8c;margin-bottom:5px}.filter-grid select,.filters>label select{width:100%;border:1px solid #e0e2eb;border-radius:11px;padding:11px;background:#fff;font-weight:800}.info{margin-top:11px;padding:10px 12px;border-radius:11px;background:#f7f5ff;color:#67607e;font-size:9px;line-height:1.6}.status{display:flex;justify-content:space-between;gap:10px;margin-top:11px;padding:10px 12px;background:#fafaff;border-radius:11px;font-size:9px}.status span{color:#8a91a0}.cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}.paper-card{display:block;text-decoration:none;color:#202438;border:1px solid #e7e8ef;border-radius:14px;padding:13px;background:#fafaff}.paper-card strong,.paper-card small,.paper-card span{display:block}.paper-card small{font-size:9px;color:#8a91a0;margin:4px 0 8px}.paper-card span{font-size:9px;color:#635bff;font-weight:900}.shift-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:11px}.shift-grid button{border:1px solid #e8e9f0;background:#fff;border-radius:11px;padding:10px;text-align:left;cursor:pointer}.shift-grid button.selected{border-color:#635bff;background:#f7f5ff}.shift-grid b,.shift-grid small{display:block}.shift-grid b{font-size:9px}.shift-grid small{font-size:7px;color:#969cab;margin-top:4px}.viewer-head a{font-size:9px;color:#635bff;font-weight:900;text-decoration:none}.viewer{height:640px;border:1px solid #e6e7ee;border-radius:13px;overflow:hidden;background:#f1f1f5}.viewer iframe{width:100%;height:100%;border:0}.source-note,.tiny{font-size:8px;line-height:1.6;color:#8b92a1}.notice{font-size:9px;color:#6c5a90;background:#f7f5ff;padding:10px;border-radius:10px;line-height:1.6}.ai-lab{background:linear-gradient(135deg,#17152f,#29234d);color:#fff;border-color:#41396d}.ai-title{display:flex;gap:10px;align-items:center}.ai-title>span{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#635bff;font-size:20px}.ai-title b,.ai-title small{display:block}.ai-title b{font-size:13px}.ai-title small{font-size:8px;color:#c9c7d8;margin-top:3px}.mode-tabs{display:flex;gap:6px;margin:13px 0}.mode-tabs button{font-size:9px;padding:9px;background:#ffffff12;color:#e8e7f2;border-color:#4a4370}.mode-tabs button.active{background:#635bff;color:#fff}.ai-lab textarea{width:100%;min-height:170px;resize:vertical;border:1px solid #514a76;border-radius:13px;background:#100e22;color:#fff;padding:12px;font:inherit;font-size:10px;outline:none}.ai-controls{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}.ai-controls label{font-size:9px}.ai-controls select{margin-left:5px;border-radius:8px;padding:7px;background:#fff}.ai-controls button{border:0;border-radius:10px;background:#fff;color:#4e46c7;padding:10px 13px;font-weight:900;cursor:pointer}.how{font-size:10px}.how>div{margin-top:8px;color:#737b8c;line-height:2}.how span{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#eeecff;color:#635bff;font-weight:900;margin:0 3px}@media(max-width:700px){.pyq-page{padding:20px 14px 90px}.hero h1{font-size:25px}.filter-grid{grid-template-columns:1fr}.cards,.shift-grid{grid-template-columns:1fr}.source-tabs{position:sticky;top:8px;z-index:10;background:#f7f7fb;padding:4px;border-radius:14px}.viewer{height:520px}.ai-controls{align-items:stretch;flex-direction:column}.ai-controls button{width:100%}.mode-tabs{overflow:auto}.mode-tabs button{white-space:nowrap}.status{align-items:flex-start;flex-direction:column}.viewer-head{align-items:center}}
    `}</style>
  </main>;
}
