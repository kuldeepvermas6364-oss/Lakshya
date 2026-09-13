"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { uploadMedia } from "../../../lib/storage";

type Block={id:string;title:string;content:string;imageUrl?:string;imageCaption?:string;imageMediaId?:string;imagePublicId?:string};
type Research={id:string;question:string;answer:string};
type Project={id:string;userId:string;name:string;topic:string;subject:string;classLevel:string;templateId:string;blocks:Block[];research:Research[]};
type Tab="home"|"research"|"project"|"preview";
type Template={id:string;name:string;subject:string;category:string;description:string;sections:string[];icon:string};
const CATEGORIES=["Science","Mathematics","Social Science","English","Computer","Environment","Exhibition","Other"];
const TEMPLATES:Template[]=[
{id:"science",name:"Science Research Project",subject:"Science",category:"Science",description:"Research, explain and conclude a school science topic.",sections:["Introduction","Objective","Background / Theory","Key Findings","Conclusion","Sources"],icon:"🔬"},
{id:"experiment",name:"Science Experiment Report",subject:"Science",category:"Science",description:"A structured school experiment report.",sections:["Aim","Introduction","Materials","Method","Observation","Result","Conclusion","Sources"],icon:"🧪"},
{id:"model",name:"Working Model Explanation",subject:"Science",category:"Exhibition",description:"Explain a working model for exhibition.",sections:["Model Overview","Principle","How It Works","Diagram","Uses","Conclusion","Sources"],icon:"⚙️"},
{id:"math",name:"Mathematics Activity Project",subject:"Mathematics",category:"Mathematics",description:"Concept, formula, examples and activity.",sections:["Introduction","Concept","Formula","Example","Activity / Calculation","Result","Conclusion","Sources"],icon:"📐"},
{id:"social",name:"Social Science Research",subject:"Social Science",category:"Social Science",description:"Research history, geography, civics or economics.",sections:["Introduction","Background","Causes / Factors","Effects","Case Study / Data","Conclusion","Sources"],icon:"🌍"},
{id:"english",name:"English Literature Project",subject:"English",category:"English",description:"Organize a literature or author project.",sections:["Introduction","About the Author / Work","Theme","Important Points","Analysis","Conclusion","Sources"],icon:"📖"},
{id:"computer",name:"Computer / Technology Project",subject:"Computer",category:"Computer",description:"Explain a technology concept clearly.",sections:["Introduction","What It Is","How It Works","Applications","Advantages / Limitations","Conclusion","Sources"],icon:"💻"},
{id:"environment",name:"Environmental Project",subject:"Environment",category:"Environment",description:"Study an environmental issue and present solutions.",sections:["Introduction","Problem","Causes","Effects","Solutions","Conclusion","Sources"],icon:"🌱"},
{id:"presentation",name:"School Presentation",subject:"Other",category:"Exhibition",description:"Prepare a clean school presentation structure.",sections:["Title","Introduction","Main Points","Visuals / Data","Conclusion","Sources"],icon:"🎤"}
];
const blocksFor=(t:Template)=>t.sections.map((title,i)=>({id:`b-${Date.now()}-${i}-${Math.random().toString(36).slice(2,7)}`,title,content:""}));

function dataUrlToFile(dataUrl:string,fileName:string){
 const [meta,data]=dataUrl.split(",");
 const mime=meta.match(/data:(.*?);base64/)?.[1]||"image/jpeg";
 const bytes=atob(data);
 const arr=new Uint8Array(bytes.length);
 for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i);
 return new File([arr],fileName,{type:mime});
}

export default function ProjectLabPage(){
 const [tab,setTab]=useState<Tab>("home");
 const [user,setUser]=useState<User|null>(null); const [projects,setProjects]=useState<Project[]>([]); const [selected,setSelected]=useState<Project|null>(null);
 const [topic,setTopic]=useState(""); const [subject,setSubject]=useState("Science"); const [classLevel,setClassLevel]=useState("10"); const [search,setSearch]=useState("");
 const [question,setQuestion]=useState(""); const [answer,setAnswer]=useState(""); const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false); const [notice,setNotice]=useState("");
 useEffect(()=>onAuthStateChanged(auth,setUser),[]);
 useEffect(()=>{if(!user){setProjects([]);return()=>{};}const q=query(collection(db,"projects"),where("userId","==",user.uid));return onSnapshot(q,s=>setProjects(s.docs.map(x=>({id:x.id,...x.data()} as Project))),e=>{console.error(e);setNotice("Saved projects could not be loaded. Check Firebase rules/index.");});},[user]);
 const guides=useMemo(()=>TEMPLATES.filter(t=>(t.category===subject||subject==="Science"&&t.category==="Science")&&(!search.trim()||`${t.name} ${t.description}`.toLowerCase().includes(search.toLowerCase()))),[subject,search]);
 function newProject(t:Template,name?:string){const n=name?.trim()||t.name;setSelected({id:`draft-${Date.now()}`,userId:user?.uid||"",name:n,topic:n,subject:t.subject,classLevel,templateId:t.id,blocks:blocksFor(t),research:[]});setAnswer("");setQuestion("");setTab("research");setNotice("Project ready. Research it, edit it, then press Save Project.");}
 function startCustom(){if(!topic.trim()){setNotice("Enter your project topic first.");return;}const t=TEMPLATES.find(x=>x.category===subject)||TEMPLATES[0];newProject({...t,id:`custom-${Date.now()}`,name:topic.trim()},topic);}
 function updateBlock(id:string,content:string){setSelected(p=>p?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,content}:b)}:p);}
 function addImage(id:string,file:File){if(!file.type.startsWith("image/")){setNotice("Please select an image file.");return;}if(file.size>10*1024*1024){setNotice("Image is too large. Please use an image under 10 MB.");return;}const r=new FileReader();r.onload=()=>setSelected(p=>p?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,imageUrl:String(r.result||""),imageMediaId:undefined,imagePublicId:undefined}:b)}:p);r.readAsDataURL(file);}
 function removeImage(id:string){setSelected(p=>p?{...p,blocks:p.blocks.map(b=>b.id===id?{...b,imageUrl:undefined,imageCaption:undefined,imageMediaId:undefined,imagePublicId:undefined}:b)}:p);}
 async function askAI(){if(!question.trim()||loading)return;setLoading(true);setAnswer("");try{const res=await fetch("/api/ai/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:`School project research. Topic: ${selected?.topic||topic}. Subject: ${selected?.subject||subject}. Class: ${selected?.classLevel||classLevel}. Student asks: ${question}. Answer in clear student-friendly language. Use headings, bullets and numbered points where useful. Do not invent citations or claim web browsing. Do not suggest unsafe experiments.`,context:"Lakshya Project Lab: research content that can be edited and added to a school project."})});const d=await res.json();if(!res.ok)throw new Error(d.error||"AI request failed");setAnswer(typeof d.text==="string"?d.text:"No answer returned.");}catch(e){setAnswer(e instanceof Error?e.message:"AI is temporarily unavailable.");}finally{setLoading(false);}}
 function addAnswer(){if(!selected||!answer)return;const item={id:`r-${Date.now()}`,question,answer};setSelected(p=>p?{...p,research:[...p.research,item],blocks:p.blocks.map((b,i)=>i===0?{...b,content:b.content?`${b.content}\n\n${answer}`:answer}:b)}:p);setNotice("AI content added to Introduction. You can edit it before saving.");setTab("project");}
 async function save(){
  if(!selected||saving)return;
  if(!user){setNotice("Please sign in first to save your project.");return;}
  setSaving(true);setNotice("Saving project and uploading images…");
  try{
   const savedBlocks:Block[]=[];
   for(let i=0;i<selected.blocks.length;i++){
    const block=selected.blocks[i];
    if(block.imageUrl?.startsWith("data:image/")){
     setNotice(`Uploading project image ${i+1}/${selected.blocks.length}…`);
     const file=dataUrlToFile(block.imageUrl,`project-${Date.now()}-${i}.jpg`);
     const media=await uploadMedia(file,"study-materials");
     savedBlocks.push({...block,imageUrl:media.secureUrl,imageMediaId:media.id,imagePublicId:media.publicId});
    }else savedBlocks.push(block);
   }
   const clean={userId:user.uid,name:selected.name.trim()||"My School Project",topic:selected.topic.trim()||selected.name.trim(),subject:selected.subject,classLevel:selected.classLevel,templateId:selected.templateId,blocks:savedBlocks,research:selected.research,updatedAt:serverTimestamp()};
   let id=selected.id;
   if(id.startsWith("draft-")){const ref=await addDoc(collection(db,"projects"),{...clean,createdAt:serverTimestamp()});id=ref.id;}else{await setDoc(doc(db,"projects",id),clean,{merge:true});}
   setSelected(p=>p?{...p,id,userId:user.uid,blocks:savedBlocks}:p);
   setNotice("✓ Project saved successfully with its images. It will remain available after refresh/login.");
  }catch(e){console.error("Project save failed",e);setNotice(e instanceof Error?`Save failed: ${e.message}`:"Could not save project. Check Firebase/Cloudinary configuration and try again.");}
  finally{setSaving(false);}
 }
 async function remove(p:Project){if(!user)return;try{await deleteDoc(doc(db,"projects",p.id));if(selected?.id===p.id)setSelected(null);setNotice("Project deleted.");}catch(e){console.error(e);setNotice("Could not delete project.");}}
 return <main className="lab">
  <header className="hero"><div><Link href="/study" className="back">← Study</Link><span className="eyebrow">LAKSHYA • PROJECT LAB</span><h1>Make your school project, smarter.</h1><p>Research with AI, add useful material, edit every section and save your complete project to your account.</p></div><button className="primary heroBtn" onClick={()=>setTab(selected?"research":"home")}>✦ Research with AI</button></header>
  <section className="steps"><div><b>01</b><strong>Topic</strong><small>Subject + class</small></div><i/><div><b>02</b><strong>Research</strong><small>Ask & understand</small></div><i/><div><b>03</b><strong>Edit</strong><small>Write + images</small></div><i/><div><b>04</b><strong>Save</strong><small>Keep forever</small></div></section>
  {notice&&<div className="notice">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
  <nav className="tabs">{(["home","research","project","preview"] as Tab[]).map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t==="home"?"Project Home":t==="research"?"AI Research Desk":t==="project"?"My Project":"Preview"}</button>)}</nav>
  {tab==="home"&&<section className="home"><div className="start"><div><span className="eyebrow">START A SCHOOL PROJECT</span><h2>What is your project about?</h2><p>Example: Water pollution, Photosynthesis, Solar system, Indian freedom movement…</p></div><div className="form"><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter project topic"/><div><select value={subject} onChange={e=>setSubject(e.target.value)}>{CATEGORIES.map(x=><option key={x}>{x}</option>)}</select><select value={classLevel} onChange={e=>setClassLevel(e.target.value)}>{[6,7,8,9,10,11,12].map(x=><option key={x}>{x}</option>)}</select></div><button className="primary" onClick={startCustom}>Start Project →</button></div></div><div className="head"><div><span className="eyebrow">PROJECT GUIDES</span><h2>Ready-made structures</h2></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search guides…"/></div><div className="cards">{guides.map(t=><article key={t.id}><span className="icon">{t.icon}</span><div><small>{t.category}</small><h3>{t.name}</h3><p>{t.description}</p><button onClick={()=>newProject(t)}>Use this guide →</button></div></article>)}</div><div className="saved"><div className="head"><div><span className="eyebrow">MY PROJECTS</span><h2>Saved work</h2></div></div>{!user?<p>Sign in to save and sync projects.</p>:projects.length===0?<p>No saved projects yet.</p>:projects.map(p=><div className="savedRow" key={p.id}><div><b>{p.name}</b><small>{p.subject} · Class {p.classLevel}</small></div><div><button onClick={()=>{setSelected(p);setTab("project")}}>Open</button><button onClick={()=>void remove(p)}>Delete</button></div></div>)}</div></section>}
  {tab==="research"&&<section className="research"><span className="aiBadge">✦ AI RESEARCH DESK</span><h2>Ask anything about your topic.</h2><p>Ask what it is, why it matters, key points, examples, diagrams, tables or project-ready explanations.</p><div className="topic">Topic: <b>{selected?.topic||topic||"Your school project"}</b> · Class {selected?.classLevel||classLevel}</div><div className="ask"><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Type your question…"/><button className="primary" disabled={!question.trim()||loading} onClick={()=>void askAI()}>{loading?"Thinking…":"Ask Lakshya AI →"}</button></div><div className="quick"><button onClick={()=>setQuestion(`What is ${selected?.topic||topic||"this topic"}?`)}>What is it?</button><button onClick={()=>setQuestion("Why is it important? Explain simply.")}>Why important?</button><button onClick={()=>setQuestion("Give me key points for a school project.")}>Key points</button><button onClick={()=>setQuestion("Suggest a useful diagram or table I can add.")}>Diagram / table</button></div>{answer&&<article className="answer"><div><span className="aiBadge">AI EXPLANATION</span><button className="add" onClick={addAnswer}>＋ Add to Project</button></div><p>{answer}</p><small>AI-assisted content is editable. Verify important facts with your textbook or reliable sources.</small></article>}<div className="researchNote"><b>Research responsibly</b><span>Check important facts and keep a Sources section before submission.</span></div></section>}
  {tab==="project"&&<section className="project">{!selected?<div className="empty"><h2>No project selected</h2><button className="primary" onClick={()=>setTab("home")}>Start a project</button></div>:<><div className="projectTop"><div><span className="eyebrow">MY PROJECT</span><input value={selected.name} onChange={e=>setSelected({...selected,name:e.target.value})}/><p>{selected.subject} · Class {selected.classLevel}</p></div><div className="actions"><button onClick={()=>setTab("research")}>＋ Research</button><button className="primary" disabled={saving} onClick={()=>void save()}>{saving?"Saving…":"Save Project"}</button></div></div><div className="projectGrid"><aside className="outline"><b>Project outline</b>{selected.blocks.map((b,i)=><button key={b.id} onClick={()=>document.getElementById(b.id)?.scrollIntoView({behavior:"smooth"})}><i>{i+1}</i>{b.title}</button>)}<button className="preview" onClick={()=>setTab("preview")}>Preview →</button></aside><section className="blocks">{selected.blocks.map(b=><article id={b.id} key={b.id}><div><b>{b.title}</b><button onClick={()=>{setQuestion(`Help me write the ${b.title} section for ${selected.topic}.`);setTab("research")}}>✦ Ask AI</button></div><textarea value={b.content} onChange={e=>updateBlock(b.id,e.target.value)} placeholder={`Write or edit your ${b.title.toLowerCase()} here…`}/>{b.imageUrl?<div className="imageBox"><img src={b.imageUrl} alt={b.imageCaption||b.title}/><input value={b.imageCaption||""} onChange={e=>setSelected(p=>p?{...p,blocks:p.blocks.map(x=>x.id===b.id?{...x,imageCaption:e.target.value}:x)}):p} placeholder="Image caption (optional)"/><button onClick={()=>removeImage(b.id)}>Remove image</button></div>:<label className="imageAdd">🖼️ Add image to this section<input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)addImage(b.id,f);e.currentTarget.value=""}}/></label>}</article>)}</section></div></>}</section>}
  {tab==="preview"&&<section className="previewPage">{!selected?<div className="empty"><h2>No project selected</h2><button className="primary" onClick={()=>setTab("home")}>Start a project</button></div>:<article className="paper"><div className="cover"><span>LAKSHYA PROJECT LAB</span><h1>{selected.name}</h1><p>{selected.subject} · Class {selected.classLevel}</p></div>{selected.blocks.map(b=><section key={b.id}><h2>{b.title}</h2>{b.content&&<p>{b.content}</p>}{b.imageUrl&&<figure><img src={b.imageUrl} alt={b.imageCaption||b.title}/>{b.imageCaption&&<figcaption>{b.imageCaption}</figcaption>}</figure>}</section>)}</article>}</section>}
 </main>;
}
