"use client";

import { useState } from "react";

const subjects = ["Physics","Chemistry","Mathematics"];
const exams = ["JEE Main","JEE Advanced","Class 12 Board"];

type Q = {question:string;options:string[];answer:number;explanation:string;importance:string;topic:string};

export default function PYQPage(){
  const [subject,setSubject]=useState("Physics");
  const [exam,setExam]=useState("JEE Main");
  const [chapter,setChapter]=useState("All chapters");
  const [language,setLanguage]=useState("English");
  const [count,setCount]=useState(20);
  const [loading,setLoading]=useState(false);
  const [data,setData]=useState<any>(null);
  const [current,setCurrent]=useState(0);
  const [selected,setSelected]=useState<number|null>(null);
  const [error,setError]=useState("");

  async function analyze(){
    setLoading(true); setError(""); setData(null); setCurrent(0); setSelected(null);
    try{
      const r=await fetch("/api/ai/pyq-analysis",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject,exam,chapter,language,questionCount:count})});
      const json=await r.json();
      if(!r.ok) throw new Error(json.error||"PYQ analysis failed");
      setData(json);
    }catch(e){setError(e instanceof Error?e.message:"PYQ analysis failed");}
    finally{setLoading(false);}
  }

  const q:Q|undefined=data?.questions?.[current];
  return <main className="page pyq-page">
    <section className="pyq-hero panel">
      <div className="badge">✦ PYQ INTELLIGENCE</div>
      <h1>PYQ Analysis → Important Practice Paper</h1>
      <p className="muted">AI studies available previous-year paper sources, finds recurring concepts and question patterns, then creates an original high-priority practice paper.</p>
      <div className="pyq-warning">Important: this is a trend-based practice paper, not a guarantee of the next exam paper.</div>
    </section>
    <section className="panel pyq-builder">
      <div className="field"><label>Exam</label><select value={exam} onChange={e=>setExam(e.target.value)}>{exams.map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="field"><label>Subject</label><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(x=><option key={x}>{x}</option>)}</select></div>
      <div className="field"><label>Chapter / scope</label><input value={chapter} onChange={e=>setChapter(e.target.value)} placeholder="e.g. Electrostatics or All chapters"/></div>
      <div className="field"><label>Language</label><select value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Hindi</option><option>Hinglish</option></select></div>
      <div className="field"><label>Questions</label><select value={count} onChange={e=>setCount(Number(e.target.value))}><option value="10">10</option><option value="20">20</option><option value="30">30</option></select></div>
      <button className="primary pyq-generate" onClick={analyze} disabled={loading}>{loading?"Analyzing PYQs…":"Analyze PYQs & Build Paper ✦"}</button>
    </section>
    {error&&<div className="practice-error">{error}</div>}
    {loading&&<section className="panel pyq-loading"><div className="pulse">✦</div><h2>Analyzing previous-year patterns…</h2><p className="muted">Checking available paper sources, recurring concepts and difficulty patterns.</p></section>}
    {data&&!loading&&<section className="pyq-results">
      <div className="panel analysis-card">
        <div className="section-title"><div><span className="badge">TREND ANALYSIS</span><h2>What the paper pattern shows</h2></div><span className="tag">Fresh analysis</span></div>
        <div className="analysis-grid">
          <div><b>Recurring topics</b><p>{(data.analysis?.recurringTopics||[]).join(" · ")||"Not enough evidence"}</p></div>
          <div><b>High-priority concepts</b><p>{(data.analysis?.highPriorityConcepts||[]).join(" · ")||"Not enough evidence"}</p></div>
          <div><b>Pattern</b><p>{data.analysis?.patternSummary||"See generated paper and source notes."}</p></div>
          <div><b>Difficulty mix</b><p>{data.analysis?.difficultyMix||"See official papers."}</p></div>
        </div>
      </div>
      {q&&<div className="panel question-card">
        <div className="question-top"><span className="badge">HIGH-PRIORITY PAPER</span><span className="tag">{current+1} / {data.questions.length}</span></div>
        <small className="muted">{q.topic} · {q.importance}</small>
        <h2>{q.question}</h2>
        <div className="options">{q.options.map((o,i)=><button key={i} disabled={selected!==null} className={selected===i?(i===q.answer?"correct":"wrong"):selected!==null&&i===q.answer?"correct":""} onClick={()=>setSelected(i)}><b>{String.fromCharCode(65+i)}</b><span>{o}</span></button>)}</div>
        {selected!==null&&<div className={selected===q.answer?"feedback good":"feedback"}>{selected===q.answer?"Correct. ":"Not quite. "}{q.explanation}</div>}
        <div className="q-actions"><span className="muted">Original question generated from analyzed trends.</span><button className="primary" disabled={selected===null} onClick={()=>{if(current<data.questions.length-1){setCurrent(x=>x+1);setSelected(null)}}}>{current<data.questions.length-1?"Next →":"Paper complete"}</button></div>
      </div>}
      <div className="panel source-card"><b>Source notes</b><p>{(data.analysis?.sourceNotes||[]).join(" · ")||"Verify every source and official paper independently."}</p><small>Generated {new Date(data.generatedAt).toLocaleString()}</small></div>
    </section>}
    <style jsx>{`
      .pyq-hero,.pyq-builder,.analysis-card,.question-card,.source-card{max-width:1050px;margin:0 auto 16px}
      .pyq-hero{padding:28px}.pyq-hero h1{font-size:30px;line-height:1.15;margin:12px 0 9px}.pyq-hero p{max-width:800px;line-height:1.65}
      .badge{display:inline-flex;padding:6px 9px;border-radius:999px;background:rgba(99,91,255,.12);color:#635bff;font-weight:900;font-size:9px;letter-spacing:.6px}.pyq-warning{margin-top:16px;padding:11px 13px;border-radius:12px;background:#fff7e8;color:#8a5a08;font-size:10px;font-weight:700}
      .pyq-builder{display:grid;grid-template-columns:1fr 1fr 1.4fr .9fr .65fr auto;gap:10px;padding:18px;align-items:end}.field label{display:block;font-size:9px;font-weight:900;color:#777f90;text-transform:uppercase}.field input,.field select{width:100%;margin-top:6px;padding:11px;border:1px solid #e1e4ec;border-radius:11px;background:#fff;font-size:11px}.pyq-generate{height:40px;white-space:nowrap}
      .pyq-loading{text-align:center;padding:50px}.pulse{font-size:35px;color:#635bff;animation:pulse 1.1s infinite}.pyq-loading h2{margin:10px 0 5px}
      .analysis-card{padding:20px}.section-title,.question-top,.q-actions{display:flex;justify-content:space-between;gap:10px;align-items:center}.section-title h2{margin:7px 0 0;font-size:19px}.tag{padding:6px 9px;border-radius:999px;background:#f1f2f8;color:#5b6070;font-size:9px;font-weight:800}.analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.analysis-grid>div{padding:14px;border:1px solid #e7e8ef;border-radius:12px}.analysis-grid b{font-size:10px}.analysis-grid p{font-size:11px;line-height:1.55;margin:6px 0 0;color:#646b7b}
      .question-card{padding:24px}.question-card>small{display:block;margin-top:15px}.question-card h2{font-size:21px;line-height:1.5;margin:12px 0 18px}.options{display:grid;gap:9px}.options button{display:grid;grid-template-columns:30px 1fr;gap:10px;text-align:left;padding:13px;border:1px solid #e3e5ec;background:#fff;border-radius:12px;cursor:pointer}.options button b{width:27px;height:27px;border-radius:8px;background:#f0f1f7;display:grid;place-items:center;color:#635bff}.options button.correct{border-color:#82dcb9;background:#effcf7}.options button.wrong{border-color:#f0a9b7;background:#fff2f4}.feedback{margin-top:13px;padding:12px;border-radius:11px;background:#fff1f3;color:#a12e48;font-size:11px;line-height:1.55}.feedback.good{background:#ecfbf5;color:#087b55}.q-actions{margin-top:18px;padding-top:15px;border-top:1px solid #eceef3;font-size:9px}
      .source-card{padding:16px;font-size:11px}.source-card p{color:#646b7b;line-height:1.5}.source-card small{color:#858b99}
      @keyframes pulse{50%{transform:scale(1.12);opacity:.65}}
      @media(max-width:900px){.pyq-builder{grid-template-columns:1fr 1fr}.pyq-generate{grid-column:1/-1}.pyq-hero h1{font-size:24px}}
      @media(max-width:600px){.pyq-builder{grid-template-columns:1fr}.pyq-generate{grid-column:auto}.analysis-grid{grid-template-columns:1fr}.pyq-hero,.question-card{padding:18px}.q-actions{align-items:flex-start;flex-direction:column}.q-actions .primary{width:100%}}
    `}</style>
  </main>
}
