"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Template = { id:string; name:string; subject:string; category:string; icon:string; description:string; kind:string };

const templates: Template[] = [
  ["percentage","Percentage Calculator","Mathematics","Calculator","%","Calculate percentage with formula and steps.","percentage"],
  ["profit-loss","Profit & Loss Calculator","Mathematics","Calculator","₹","Practice profit, loss and percentage.","profit"],
  ["interest","Simple & Compound Interest","Mathematics","Calculator","∑","Compare SI and CI with clear working.","interest"],
  ["quadratic","Quadratic Equation Solver","Mathematics","Solver","x²","Solve quadratic equations step-by-step.","quadratic"],
  ["trigonometry","Trigonometry Helper","Mathematics","Calculator","△","Explore common trigonometric values.","trig"],
  ["statistics","Statistics Calculator","Mathematics","Calculator","σ","Mean, median, mode and range practice.","statistics"],
  ["scientific","Scientific Calculator","Mathematics","Calculator","⌘","A clean scientific calculation workspace.","scientific"],
  ["unit-converter","Unit Converter","Mathematics","Utility","↔","Convert common length, mass and temperature units.","units"],
  ["ohm","Ohm's Law Calculator","Physics","Calculator","Ω","Calculate V, I or R using Ohm's law.","ohm"],
  ["kinematics","Kinematics Calculator","Physics","Calculator","↗","Practice distance, velocity and acceleration.","kinematics"],
  ["projectile","Projectile Motion","Physics","Simulation","◌","Explore projectile motion with adjustable values.","projectile"],
  ["lens","Lens Formula Helper","Physics","Calculator","◉","Work with focal length and image distance.","lens"],
  ["waves","Wave Calculator","Physics","Calculator","∿","Relate frequency, wavelength and wave speed.","waves"],
  ["circuits","Electric Circuit Explorer","Physics","Simulation","⚡","Learn basic series and parallel circuit ideas.","circuits"],
  ["mole","Mole Concept Calculator","Chemistry","Calculator","mol","Convert mass, molar mass and moles.","mole"],
  ["molar-mass","Molar Mass Helper","Chemistry","Calculator","M","Calculate molar mass from common compounds.","molar"],
  ["concentration","Concentration Calculator","Chemistry","Calculator","C","Practice molarity and solution calculations.","concentration"],
  ["ph","pH Learning Tool","Chemistry","Learning","pH","Explore the pH scale with educational examples.","ph"],
  ["periodic","Periodic Table Explorer","Chemistry","Explorer","⚛","Build an interactive periodic-table project.","periodic"],
  ["reactions","Reaction Revision Cards","Chemistry","Revision","↻","Organize important reactions for revision.","reactions"],
  ["flashcards","Study Flashcards","Study","Revision","▣","Create quick question-and-answer revision cards.","flashcards"],
  ["pomodoro","Pomodoro Study Timer","Study","Productivity","◷","Focused study and break timer starter.","pomodoro"],
  ["planner","Daily Study Planner","Study","Productivity","✓","Plan subjects, tasks and study sessions.","planner"],
  ["countdown","Exam Countdown","Study","Productivity","⌛","Create a simple countdown for an exam goal.","countdown"],
  ["revision","Revision Tracker","Study","Productivity","↗","Track chapters as planned, learning or revised.","revision"],
  ["quiz","MCQ Quiz","Exam Prep","Practice","?","Create a focused multiple-choice practice page.","quiz"],
  ["mock-test","Mock Test Dashboard","Exam Prep","Practice","▤","Build a timed mock-test interface.","mock"],
  ["mistakes","Mistake Tracker","Exam Prep","Analytics","!","Record mistakes and plan corrections.","mistakes"],
  ["score","Exam Score Calculator","Exam Prep","Calculator","★","Calculate marks, percentage and accuracy.","score"],
  ["chapter-checklist","Chapter Checklist","Notes","Revision","☑","Create a chapter-by-chapter completion tracker.","checklist"]
].map(([id,name,subject,category,icon,description,kind])=>({id,name,subject,category,icon,description,kind}));

function makeFiles(t:Template){
  const title=t.name;
  const safe=title.replace(/&/g,"and");
  const html=`<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe}</title></head><body><main><span>${t.subject.toUpperCase()} • ${t.category.toUpperCase()}</span><h1>${safe}</h1><p>${t.description}</p><section id="app"><label>Value <input id="value" type="number" placeholder="Enter a value"></label><button id="run">Calculate / Explore</button><div id="result" class="result">Your result will appear here.</div></section><small class="learn">Learning mode • Understand the method, then practice.</small></main></body></html>`;
  const css=`*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:Inter,system-ui,sans-serif;background:linear-gradient(135deg,#f5f3ff,#eef7ff);color:#202336;display:grid;place-items:center;padding:24px}main{width:min(720px,100%);padding:34px;border:1px solid rgba(99,91,255,.16);border-radius:28px;background:rgba(255,255,255,.86);box-shadow:0 24px 70px rgba(50,50,100,.12)}span{font-size:10px;font-weight:900;letter-spacing:.14em;color:#635bff}h1{font-size:clamp(30px,7vw,58px);line-height:.98;letter-spacing:-.05em;margin:12px 0}p{color:#697184;line-height:1.65}#app{margin-top:24px;padding:18px;border-radius:18px;background:#f8f8fc}label{display:grid;gap:7px;font-size:11px;font-weight:800}input{width:100%;padding:12px;border:1px solid #dfe1ea;border-radius:11px;font:inherit;background:#fff}button{margin-top:12px;padding:12px 16px;border:0;border-radius:11px;background:#635bff;color:#fff;font-weight:900;cursor:pointer}.result{margin-top:12px;padding:14px;border-radius:11px;background:#fff;border:1px solid #e4e5ee;font-weight:800}.learn{display:block;margin-top:18px;color:#8a90a0;font-size:10px}`;
  const script=`const kind=${JSON.stringify(t.kind)};const out=document.getElementById('result');document.getElementById('run').onclick=()=>{const n=Number(document.getElementById('value').value||0);let text='Enter a value to begin.';if(n||n===0){if(kind==='percentage')text='Example method: percentage = (part ÷ total) × 100';else if(kind==='profit')text='Practice: profit = selling price − cost price';else if(kind==='interest')text='Compare simple and compound interest using principal, rate and time.';else if(kind==='ohm')text='Ohm\'s law: V = I × R';else if(kind==='mole')text='Moles = mass ÷ molar mass';else if(kind==='score')text='Score practice started. Add your correct and total questions next.';else if(kind==='ph')text='pH learning mode: explore acidic, neutral and basic ranges.';else text='Great start! Customize this project with your own study logic.';}out.textContent=text;};`;
  return {"index.html":html,"style.css":css,"script.js":script};
}

export default function TemplateLibrary(){
  const [query,setQuery]=useState(""); const [subject,setSubject]=useState("All");
  const filtered=useMemo(()=>templates.filter(t=>(subject==='All'||t.subject===subject)&&`${t.name} ${t.subject} ${t.category}`.toLowerCase().includes(query.toLowerCase())),[query,subject]);
  function useTemplate(t:Template){localStorage.setItem("lakshya-project-lab",JSON.stringify({name:t.name,files:makeFiles(t)}));window.location.href="/study/projects";}
  return <main className="library"><header><Link href="/study/projects">← Project Lab</Link><span>LAKSHYA • EDUCATIONAL TEMPLATE LIBRARY</span><h1>Build something useful.</h1><p>30 ready-to-customize study projects for Maths, Physics, Chemistry, exams, revision and productivity.</p></header><div className="controls"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search calculator, quiz, physics…" aria-label="Search templates"/><select value={subject} onChange={e=>setSubject(e.target.value)}><option>All</option><option>Mathematics</option><option>Physics</option><option>Chemistry</option><option>Study</option><option>Exam Prep</option><option>Notes</option></select></div><div className="grid">{filtered.map(t=><article key={t.id}><div className="icon">{t.icon}</div><span className="tag">{t.subject} • {t.category}</span><h2>{t.name}</h2><p>{t.description}</p><button onClick={()=>useTemplate(t)}>Use Template →</button></article>)}</div>{!filtered.length&&<div className="empty">No matching templates. Try another search.</div>}<style jsx>{` .library{min-height:100vh;padding:30px 20px 70px;background:#f7f7fb;color:#202336}.library header,.grid,.controls{max-width:1180px;margin:auto}.library header{padding:10px 0 25px}.library header a{color:#635bff;text-decoration:none;font-size:12px;font-weight:900}.library header span{display:block;margin-top:22px;color:#8a90a0;font-size:9px;font-weight:900;letter-spacing:.16em}.library h1{font-size:clamp(38px,7vw,72px);letter-spacing:-.06em;line-height:.95;margin:9px 0}.library header p{max-width:650px;color:#72798a;line-height:1.6}.controls{display:flex;gap:10px;margin-bottom:16px}.controls input,.controls select{border:1px solid #dddfea;background:#fff;border-radius:12px;padding:12px;outline:0}.controls input{flex:1}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.grid article{background:#fff;border:1px solid #e1e2eb;border-radius:18px;padding:18px;box-shadow:0 8px 25px rgba(40,45,90,.05);transition:transform .2s,box-shadow .2s}.grid article:hover{transform:translateY(-3px);box-shadow:0 15px 35px rgba(40,45,90,.1)}.icon{font-size:25px;font-weight:900;color:#635bff}.tag{display:block;margin-top:12px;font-size:8px;font-weight:900;color:#8a90a0;letter-spacing:.08em}.grid h2{font-size:17px;margin:7px 0}.grid p{font-size:10px;line-height:1.6;color:#747b8b;min-height:33px}.grid button{border:0;border-radius:10px;padding:10px 12px;background:#202336;color:#fff;font-size:9px;font-weight:900;cursor:pointer}.empty{max-width:1180px;margin:auto;padding:40px;text-align:center;color:#818798}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.library{padding:20px 12px 60px}.controls{flex-direction:column}.grid{grid-template-columns:1fr}.grid p{min-height:0}}@media(prefers-reduced-motion:reduce){.grid article{transition:none}}`}</style></main>;
}
