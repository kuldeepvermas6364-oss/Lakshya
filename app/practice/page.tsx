"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const curriculum = {
  Physics: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics & Optical Instruments", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
  Chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
  Mathematics: ["Relations & Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Probability"]
} as const;
type Subject = keyof typeof curriculum;
type Difficulty = "Foundation" | "JEE" | "Challenge";
type Question = { question:string; options:string[]; answer:number; explanation:string };

function PracticeContent(){
  const searchParams = useSearchParams();
  const requestedSubject = searchParams.get("subject") as Subject | null;
  const requestedChapter = searchParams.get("chapter");
  const initialSubject = requestedSubject && requestedSubject in curriculum ? requestedSubject : "Physics";
  const [subject,setSubject]=useState<Subject>(initialSubject);
  const [chapter,setChapter]=useState<string>(requestedChapter && curriculum[initialSubject].includes(requestedChapter as never) ? requestedChapter : curriculum[initialSubject][0]);
  const [difficulty,setDifficulty]=useState<Difficulty>("JEE");
  const [questions,setQuestions]=useState<Question[]>([]);
  const [q,setQ]=useState(0); const [selected,setSelected]=useState<number|null>(null);
  const [uid,setUid]=useState<string|null>(null); const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const score=useMemo(()=>questions.reduce((n,item,i)=>n+(i<q && item ? 0 : 0),0),[questions,q]);

  useEffect(()=>{
    let active=true;
    (async()=>{try{const [{auth},{onAuthStateChanged}]=await Promise.all([import("@/lib/firebase"),import("firebase/auth")]);if(!active)return;const unsubscribe=onAuthStateChanged(auth,u=>active&&setUid(u?.uid??null),()=>active&&setUid(null));return()=>unsubscribe();}catch{if(active)setUid(null)}})();
  },[]);

  useEffect(()=>{
    if(!requestedSubject || !(requestedSubject in curriculum)) return;
    setSubject(requestedSubject);
    if(requestedChapter && curriculum[requestedSubject].includes(requestedChapter as never)) setChapter(requestedChapter);
  },[requestedSubject,requestedChapter]);

  function reset(nextSubject:Subject,nextChapter:string){setSubject(nextSubject);setChapter(nextChapter);setQuestions([]);setSelected(null);setQ(0);setSaved(false);setError("")}
  async function generate(){
    setLoading(true);setError("");setQuestions([]);setSelected(null);setQ(0);setSaved(false);
    try{const r=await fetch("/api/ai/quiz",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject,chapter,difficulty})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Quiz generation failed");setQuestions(Array.isArray(data.questions)?data.questions:[]);if(!data.questions?.length)throw new Error("No valid questions were returned.");}
    catch(e){setError(e instanceof Error?e.message:"Could not generate quiz.")}finally{setLoading(false)}
  }
  async function answer(i:number){
    if(selected!==null)return;
    setSelected(i);
    if(uid&&questions[q]){try{const {savePracticeAttempt}=await import("@/lib/study-storage");await savePracticeAttempt(uid,{subject,chapter,correct:i===questions[q].answer});setSaved(true)}catch(e){setError(e instanceof Error?e.message:"Could not save attempt")}}
  }
  function next(){setQ(x=>x+1);setSelected(null);setSaved(false)}
  const current=questions[q];
  return <main className="page practice-page"><div className="hero-row"><div><p className="eyebrow">PRACTICE ARENA</p><h1>Practice from your real syllabus.</h1><p className="muted">AI-generated questions, instant explanations and Firebase-backed attempt history.</p></div><Link className="primary" href="/study">Study hub →</Link></div>
    <section className="practice-builder panel"><div><p className="eyebrow">BUILD YOUR SESSION</p><h2>{requestedChapter?"Chapter practice ready":"Generate a fresh quiz"}</h2></div><div className="builder-grid">
      <label>Subject<select value={subject} onChange={e=>{const s=e.target.value as Subject;reset(s,curriculum[s][0])}}>{(Object.keys(curriculum) as Subject[]).map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Chapter<select value={chapter} onChange={e=>{setChapter(e.target.value);setQuestions([]);setSelected(null);setQ(0)}}>{curriculum[subject].map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Level<select value={difficulty} onChange={e=>{setDifficulty(e.target.value as Difficulty);setQuestions([]);setSelected(null);setQ(0)}}><option>Foundation</option><option>JEE</option><option>Challenge</option></select></label>
      <button className="primary" onClick={generate} disabled={loading}>{loading?"Generating…":"Generate quiz ✦"}</button>
    </div></section>
    {error&&<div className="practice-error">{error}</div>}
    {!current&&!loading&&<section className="practice-empty panel"><div>✦</div><h2>Ready when you are.</h2><p className="muted">{requestedChapter?`Your ${subject} · ${chapter} practice context is selected.`:"Choose a subject and chapter."} Then generate a fresh quiz with Lakshya AI.</p><button className="primary" onClick={generate}>Start practice →</button></section>}
    {loading&&<section className="practice-empty panel"><div className="loader">✦</div><h2>Building your quiz…</h2><p className="muted">Lakshya AI is preparing {difficulty.toLowerCase()}-level chapter questions.</p></section>}
    {current&&<section className="practice-card panel"><div className="practice-meta"><span className="tag active-tag">{subject}</span><span className="tag">{chapter}</span><span className="tag">{difficulty}</span><span className="muted">QUESTION {q+1} / {questions.length}</span></div><h2>{current.question}</h2><div className="answer-grid">{current.options.map((a,i)=><button key={`${a}-${i}`} onClick={()=>answer(i)} disabled={selected!==null} className={`answer-option ${selected===i?(i===current.answer?'correct':'wrong'):''} ${selected!==null&&i===current.answer?'revealed':''}`}><span>{String.fromCharCode(65+i)}</span><span>{a}</span>{selected!==null&&i===current.answer&&<b>✓</b>}{selected===i&&i!==current.answer&&<b>×</b>}</button>)}</div>{selected!==null&&<div className={`answer-feedback ${selected===current.answer?'good':'retry'}`}>{selected===current.answer?`Correct! ${current.explanation}`:`Not quite. ${current.explanation}`}</div>}<div className="practice-footer"><span className="muted">{uid?(saved?'✓ Attempt saved to Firebase':'Saving attempt…'):'Sign in to save your attempt'}</span>{q<questions.length-1?<button className="primary" onClick={next} disabled={selected===null}>Next question →</button>:<button className="primary" onClick={generate}>Generate another →</button>}</div></section>}
    <style jsx>{`.practice-builder{margin:0 auto 16px;padding:20px;max-width:1000px}.practice-builder h2{margin:5px 0 0;font-size:20px}.builder-grid{display:grid;grid-template-columns:1fr 1.5fr .8fr auto;gap:10px;margin-top:15px;align-items:end}.builder-grid label{font-size:9px;color:#777f90;font-weight:800;text-transform:uppercase;letter-spacing:.5px}.builder-grid select{display:block;width:100%;margin-top:6px;border:1px solid #e1e4ec;background:#fff;border-radius:11px;padding:11px;font-size:11px;color:#252a3b;outline:none}.practice-empty{text-align:center;padding:50px 20px;max-width:900px;margin:auto}.practice-empty>div{font-size:34px;color:#635bff}.practice-empty h2{margin:10px 0 5px}.practice-empty .primary{margin-top:15px}.loader{animation:spin 1s linear infinite}.practice-error{max-width:900px;margin:0 auto 14px;padding:11px 14px;border-radius:11px;background:#fff2f4;color:#a52f48;font-size:10px}.practice-card{max-width:900px;margin:0 auto;padding:26px;animation:riseIn .35s ease both}.practice-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.practice-meta .muted{margin-left:auto;font-size:9px}.practice-card>h2{font-size:23px;line-height:1.45;margin:24px 0}.answer-grid{display:grid;gap:10px}.answer-option{display:grid;grid-template-columns:34px 1fr 20px;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid #e4e6ee;background:#fff;border-radius:13px;padding:14px;color:#34394a;transition:.2s;cursor:pointer}.answer-option:hover:not(:disabled){transform:translateX(3px);border-color:#c9c5ff;box-shadow:0 8px 20px rgba(38,44,90,.07)}.answer-option:disabled{cursor:default}.answer-option>span:first-child{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:#f1f2f8;color:#635bff;font-weight:800}.answer-option.correct{border-color:#8ce0c2;background:#effcf7}.answer-option.wrong{border-color:#f2b1bd;background:#fff4f6}.answer-option.revealed{border-color:#8ce0c2;background:#effcf7}.answer-feedback{margin-top:14px;padding:12px;border-radius:11px;font-size:11px;line-height:1.6;font-weight:700}.answer-feedback.good{background:#ecfbf5;color:#087b55}.answer-feedback.retry{background:#fff1f3;color:#b12f4a}.practice-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;padding-top:18px;border-top:1px solid #eceef3}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.builder-grid{grid-template-columns:1fr 1fr}.builder-grid button{grid-column:1/-1}}@media(max-width:700px){.builder-grid{grid-template-columns:1fr}.builder-grid button{grid-column:auto}.practice-card{padding:18px}.practice-meta .muted{width:100%;margin-left:0}.practice-card>h2{font-size:18px}.practice-footer{align-items:flex-start;flex-direction:column}}`}</style>
  </main>
}

export default function PracticePage(){
  return <Suspense fallback={<main className="page practice-page"><section className="practice-empty panel"><div className="loader">✦</div><h2>Loading practice…</h2><p className="muted">Preparing your practice arena.</p></section></main>}><PracticeContent /></Suspense>;
}
