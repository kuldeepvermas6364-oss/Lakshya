"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const subjects = {
  Physics: ["Electric Charges & Fields","Electrostatic Potential & Capacitance","Current Electricity","Moving Charges & Magnetism","Magnetism & Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics & Optical Instruments","Wave Optics","Dual Nature of Radiation & Matter","Atoms","Nuclei","Semiconductor Electronics"],
  Chemistry: ["Solutions","Electrochemistry","Chemical Kinetics","d- and f-Block Elements","Coordination Compounds","Haloalkanes & Haloarenes","Alcohols, Phenols & Ethers","Aldehydes, Ketones & Carboxylic Acids","Amines","Biomolecules","Polymers","Chemistry in Everyday Life"],
  Mathematics: ["Relations & Functions","Inverse Trigonometric Functions","Matrices","Determinants","Continuity & Differentiability","Applications of Derivatives","Integrals","Applications of Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Probability"],
  English: ["The Last Lesson","Lost Spring","Deep Water","The Rattrap","Indigo","Poets and Pancakes","The Interview","Going Places","My Mother at Sixty-Six","An Elementary School Classroom in a Slum","Keeping Quiet","A Thing of Beauty","A Roadside Stand","Aunt Jennifer's Tigers","The Third Level","The Tiger King","Journey to the End of the Earth","The Enemy","On the Face of It","Memories of Childhood"],
  Hindi: ["आत्मपरिचय","एक गीत","पतंग","कविता के बहाने","कैमरे में बंद अपाहिज","सहर्ष स्वीकारा है","उषा","बादल राग","कवितावली","लक्ष्मण-मूर्छा और राम का विलाप","रुबाइयाँ","छोटा मेरा खेत","बगुलों के पंख","सिल्वर वैडिंग","जूझ","अतीत में दबे पाँव","डायरी के पन्ने"]
} as const;

type Subject = keyof typeof subjects;
type MaterialKey = "quiz" | "notes" | "summary" | "flashcards" | "practice" | "pyq" | "tricky";

const subjectMeta: Record<Subject,{icon:string;className:string;subtitle:string}> = {
  Physics:{icon:"⚛",className:"physics",subtitle:"Class 12 Physics"},
  Chemistry:{icon:"⚗",className:"chemistry",subtitle:"Class 12 Chemistry"},
  Mathematics:{icon:"π",className:"mathematics",subtitle:"Class 12 Mathematics"},
  English:{icon:"Aa",className:"english",subtitle:"Class 12 English"},
  Hindi:{icon:"अ",className:"hindi",subtitle:"Class 12 Hindi"}
};

const materials: {key:MaterialKey;icon:string;title:string;desc:string}[] = [
  {key:"quiz",icon:"🧠",title:"Quiz / क्विज़",desc:"Chapter-wise MCQs & timed tests"},
  {key:"notes",icon:"📝",title:"Notes / नोट्स",desc:"Detailed study notes"},
  {key:"summary",icon:"📄",title:"Summary / सारांश",desc:"Quick revision summaries"},
  {key:"flashcards",icon:"🗂",title:"Flashcards / फ्लैशकार्ड",desc:"Active-recall revision"},
  {key:"practice",icon:"✍",title:"Practice / अभ्यास",desc:"Concept & JEE-level questions"},
  {key:"pyq",icon:"📚",title:"PYQ / पिछले वर्ष के प्रश्न",desc:"Previous-year questions"},
  {key:"tricky",icon:"⚡",title:"Tricky Questions / ट्रिकी प्रश्न",desc:"High-thinking questions & traps"}
];

const chapterId = (subject:Subject,chapter:string) => `${subject.toLowerCase()}-${chapter.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;
const chapterUrl = (subject:Subject,chapter:string) => `/study/chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;

export default function StudyPage(){
  const [tab,setTab]=useState<"chapters"|"materials">("chapters");
  const [openMaterial,setOpenMaterial]=useState<MaterialKey|null>(null);
  const [openSubject,setOpenSubject]=useState<Subject|null>(null);
  const [search,setSearch]=useState("");
  const [uid,setUid]=useState<string|null>(null);
  const [progress,setProgress]=useState<Record<string,number>>({});
  const [message,setMessage]=useState("");

  useEffect(()=>{
    let active=true; let unsubscribe=()=>{};
    (async()=>{
      try{
        const [{auth},{onAuthStateChanged}]=await Promise.all([import("@/lib/firebase"),import("firebase/auth")]);
        if(!active)return;
        unsubscribe=onAuthStateChanged(auth,user=>active&&setUid(user?.uid??null),()=>active&&setUid(null));
      }catch{if(active)setUid(null)}
    })();
    return()=>{active=false;unsubscribe()};
  },[]);

  useEffect(()=>{
    if(!uid){setProgress({});return}
    let active=true; let unsubscribe=()=>{};
    (async()=>{
      try{
        const [{realtimeDb},{onValue,ref}]=await Promise.all([import("@/lib/firebase"),import("firebase/database")]);
        if(!active)return;
        unsubscribe=onValue(ref(realtimeDb,`users/${uid}/chapterProgress`),snap=>{
          if(!active)return;
          const next:Record<string,number>={};
          if(snap.exists())Object.entries(snap.val() as Record<string,unknown>).forEach(([id,value])=>{
            next[id]=Math.max(0,Math.min(100,Number((value as {progress?:number})?.progress??value)||0));
          });
          setProgress(next);
        },e=>active&&setMessage(e.message));
      }catch(e){if(active)setMessage(e instanceof Error?e.message:"Firebase is temporarily unavailable.")}
    })();
    return()=>{active=false;unsubscribe()};
  },[uid]);

  const totalChapters=useMemo(()=>Object.values(subjects).reduce((n,list)=>n+list.length,0),[]);
  const completedChapters=Object.values(progress).filter(v=>v>=100).length;
  const overallProgress=totalChapters?Math.round(completedChapters/totalChapters*100):0;

  async function toggleComplete(subject:Subject,chapter:string){
    if(!uid){setMessage("Sign in करें / Sign in to save your chapter progress.");return}
    const id=chapterId(subject,chapter); const next=progress[id]>=100?0:100;
    try{
      const {updateChapterProgress}=await import("@/lib/study-storage");
      await updateChapterProgress(uid,id,next);
      setMessage(next?`${chapter} completed / पूरा mark हुआ।`:`${chapter} reopened / फिर से खोला गया।`);
    }catch(e){setMessage(e instanceof Error?e.message:"Could not save progress / Progress save नहीं हुआ।")}
  }

  function toggleMaterial(key:MaterialKey){setOpenMaterial(openMaterial===key?null:key);setOpenSubject(null)}

  return <main className="study-library">
    <header className="study-topbar">
      <Link href="/" className="study-back">←</Link>
      <div><h1>Study / पढ़ाई</h1><p>Class 12 • PCM + Languages</p></div>
      <div className="xp-pill"><span>✦</span><b>{overallProgress}%</b><small>progress</small></div>
    </header>

    <nav className="study-tabs" aria-label="Study sections">
      <button className={tab==="chapters"?"active":""} onClick={()=>setTab("chapters")}>Chapters</button>
      <button className={tab==="materials"?"active":""} onClick={()=>setTab("materials")}>Study Material</button>
    </nav>

    {tab==="chapters"?<>
      <section className="completion-note"><div><b>Completion %</b><span>depends on your chapter progress</span></div><strong>{completedChapters}/{totalChapters} completed</strong></section>
      <div className="subject-list">
        {(Object.keys(subjects) as Subject[]).map(subject=>{
          const meta=subjectMeta[subject];
          const done=subjects[subject].filter(ch=>progress[chapterId(subject,ch)]>=100).length;
          const pct=subjects[subject].length?Math.round(done/subjects[subject].length*100):0;
          return <Link href={`/study/${subject.toLowerCase()}`} className="subject-card" key={subject}>
            <span className={`subject-icon ${meta.className}`}>{meta.icon}</span>
            <span className="subject-main"><b>{subject}</b><small>{meta.subtitle} • {done}/{subjects[subject].length} chapters completed</small><i><em style={{width:`${pct}%`}}/></i></span>
            <span className="subject-percent">{pct}%</span>
            <span className="subject-arrow">›</span>
          </Link>
        })}
      </div>
    </>:<>
      <section className="material-head"><p>STUDY MATERIAL / पढ़ाई सामग्री</p><h2>Learn, practise & revise</h2><span>Quiz, Notes, Summary, Flashcards, Practice, PYQ और Tricky Questions — सब एक ही clean format में.</span></section>
      <div className="material-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chapters / chapters खोजें..."/></div>
      <div className="special-materials">
        <Link href="/study/ncert" className="special-card"><span>📚</span><div><b>NCERT Library / NCERT लाइब्रेरी</b><small>Class 12 official chapter material</small></div><strong>→</strong></Link>
        <Link href="/study/pyq" className="special-card"><span>📑</span><div><b>PYQ & Practice Center</b><small>UPMSP + JEE Main • MCQ / Full Paper / Short Question</small></div><strong>→</strong></Link>
      </div>
      <section className="material-list">
        {materials.map(item=>{
          const isOpen=openMaterial===item.key;
          return <div className={`material-card ${isOpen?"open":""}`} key={item.key}>
            <button className="material-row" onClick={()=>toggleMaterial(item.key)}><span className="material-icon">{item.icon}</span><span className="material-copy"><b>{item.title}</b><small>{item.desc}</small></span><span className="material-arrow">{isOpen?"⌄":"›"}</span></button>
            {isOpen&&<div className="material-body">
              {(Object.keys(subjects) as Subject[]).map(subject=>{
                const visible=subjects[subject].filter(ch=>ch.toLowerCase().includes(search.toLowerCase()));
                const subjectDone=subjects[subject].filter(ch=>progress[chapterId(subject,ch)]>=100).length;
                const subjectOpen=openSubject===subject;
                const meta=subjectMeta[subject];
                return <div className="material-subject" key={subject}>
                  <button className="material-subject-row" onClick={()=>setOpenSubject(subjectOpen?null:subject)}><span className={`mini-subject ${meta.className}`}>{meta.icon}</span><b>{subject}</b><small>{subjectDone}/{subjects[subject].length} done</small><span>{subjectOpen?"⌄":"›"}</span></button>
                  {subjectOpen&&<div className="material-chapters">{visible.map(chapter=>{
                    const done=progress[chapterId(subject,chapter)]>=100;
                    const workspace=chapterUrl(subject,chapter);
                    const action=item.key==="quiz"?`/quiz?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`:workspace;
                    return <div className={`material-chapter ${done?"done":""}`} key={chapter}><Link href={action} className="chapter-link"><span>{done?"✓":"📄"}</span><b>{chapter}</b></Link>{item.key==="quiz"?<Link href={action} className="start-button">Start MCQ</Link>:<div className="chapter-actions"><span>{done?"Completed":"Not started"}</span><button onClick={()=>toggleComplete(subject,chapter)}>{done?"Reopen":"Mark done"}</button></div>}</div>
                  })}{visible.length===0&&<p className="empty-material">No matching chapters / कोई matching chapter नहीं मिला।</p>}</div>}
                </div>
              })}
            </div>}
          </div>
        })}
      </section>
    </>}

    {message&&<p className="study-message">{message}</p>}
    <section className="workspace-tip"><span>✦</span><div><b>Chapter Workspace / अध्याय वर्कस्पेस</b><p>Chapter खोलकर Lakshya AI से पढ़ो और useful explanations को MCQ, Flashcard, Key Point या Quick Revision में save करो.</p></div></section>

    <style jsx>{`
      .study-library{max-width:1080px;margin:0 auto;padding:18px 28px 130px;min-height:100vh;background:linear-gradient(145deg,#fbfaff 0%,#f5f2ff 48%,#fff4fb 100%);animation:studyIn .35s ease both}
      .study-topbar{display:flex;align-items:center;gap:13px;padding:4px 0 16px}.study-back{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:rgba(255,255,255,.78);border:1px solid #e4dfef;text-decoration:none;color:#45404f;font-size:24px}.study-topbar h1{margin:0;font-size:27px;letter-spacing:-.8px;color:#25243a}.study-topbar p{margin:3px 0 0;font-size:10px;color:#8e899c}.xp-pill{margin-left:auto;display:flex;align-items:center;gap:6px;padding:10px 14px;border-radius:20px;background:rgba(255,255,255,.82);border:1px solid #e0daef;color:#635bff}.xp-pill span{font-size:17px}.xp-pill b{font-size:14px}.xp-pill small{font-size:9px;color:#9691a3}
      .study-tabs{display:flex;gap:40px;height:50px;border-bottom:1px solid #e4e0eb;margin-bottom:15px}.study-tabs button{position:relative;border:0;background:transparent;padding:0 0 13px;font-size:15px;font-weight:900;color:#777383;cursor:pointer}.study-tabs button.active{color:#635bff}.study-tabs button.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;border-radius:5px;background:#635bff}
      .completion-note{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px 16px;border-radius:14px;background:#fff7e8;border:1px solid #f0dfbd;color:#59545e;font-size:10px;margin-bottom:13px}.completion-note div{display:flex;gap:4px;align-items:center}.completion-note b{color:#292532}.completion-note span{color:#6c6772}.completion-note strong{color:#635bff;font-size:10px}
      .subject-list{display:grid;gap:12px}.subject-card{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid #e2dfea;border-radius:18px;background:rgba(255,255,255,.9);text-decoration:none;color:#282633;box-shadow:0 6px 22px rgba(62,52,112,.05);transition:.22s ease}.subject-card:hover{transform:translateY(-2px);border-color:#c9c2ff;box-shadow:0 12px 28px rgba(78,65,160,.1)}
      .subject-icon{width:54px;height:54px;flex:0 0 54px;border-radius:16px;display:grid;place-items:center;font-size:24px;font-weight:900;box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}.subject-icon.physics{background:#e8f3ff;color:#2469bd}.subject-icon.chemistry{background:#e5faf3;color:#18896c}.subject-icon.mathematics{background:#f8e9ff;color:#9d42c8}.subject-icon.english{background:#fff0e5;color:#df742f;font-size:17px}.subject-icon.hindi{background:#ffeaf5;color:#bd4f86;font-size:25px}
      .subject-main{flex:1;min-width:0}.subject-main b{display:block;font-size:16px;color:#28263a}.subject-main small{display:block;color:#8e8998;font-size:9px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.subject-main i{display:block;height:7px;background:#e7e4ec;border-radius:99px;margin-top:8px;overflow:hidden}.subject-main em{display:block;height:100%;background:linear-gradient(90deg,#635bff,#c14dff);border-radius:99px;transition:width .4s ease}.subject-percent{width:35px;text-align:right;font-size:11px;font-weight:900;color:#635bff}.subject-arrow{font-size:30px;color:#8c8794;margin-left:2px}
      .material-head{padding:8px 2px 11px}.material-head p{margin:0 0 3px;font-size:8px;font-weight:900;letter-spacing:1.1px;color:#7c73c8}.material-head h2{margin:0;font-size:23px;color:#29263b}.material-head span{display:block;margin-top:5px;color:#8b8797;font-size:10px;line-height:1.55}
      .material-search{height:46px;display:flex;align-items:center;gap:10px;padding:0 14px;background:#fff;border:1px solid #ddd9e6;border-radius:14px;margin:5px 0 13px}.material-search span{font-size:22px;color:#8b8794}.material-search input{flex:1;border:0;outline:0;background:transparent;font-size:11px;color:#333}
      .special-materials{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:13px}.special-card{display:flex;align-items:center;gap:11px;padding:13px 14px;border:1px solid #dcd6fa;border-radius:16px;background:linear-gradient(110deg,#fff,#f7f5ff 65%,#fff4fb);text-decoration:none;color:#29263b}.special-card>span{width:42px;height:42px;border-radius:12px;background:#eeebff;display:grid;place-items:center;font-size:20px}.special-card div{flex:1;min-width:0}.special-card b,.special-card small{display:block}.special-card b{font-size:11px}.special-card small{font-size:8px;color:#898594;margin-top:3px;line-height:1.4}.special-card strong{color:#635bff;font-size:20px}
      .material-list{display:grid;gap:9px}.material-card{border:1px solid #e2dfe8;border-radius:17px;background:rgba(255,255,255,.92);overflow:hidden;box-shadow:0 5px 18px rgba(50,42,90,.045)}.material-card.open{border-color:#cfc8ff}.material-row{width:100%;display:flex;align-items:center;gap:12px;padding:15px;border:0;background:transparent;text-align:left;cursor:pointer}.material-icon{width:45px;height:45px;border-radius:14px;background:#f0edff;display:grid;place-items:center;font-size:21px;flex:none}.material-copy{flex:1}.material-copy b,.material-copy small{display:block}.material-copy b{font-size:13px;color:#292735}.material-copy small{font-size:8px;color:#8f8b9b;margin-top:3px;line-height:1.45}.material-arrow{font-size:23px;color:#635bff}.material-body{padding:0 12px 12px 68px;background:#fbfaff}.material-subject{border-top:1px solid #ece9f1}.material-subject-row{width:100%;display:flex;align-items:center;gap:9px;padding:10px 5px;border:0;background:transparent;text-align:left;cursor:pointer}.mini-subject{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:13px;font-weight:900}.mini-subject.physics{background:#e8f3ff;color:#2469bd}.mini-subject.chemistry{background:#e5faf3;color:#18896c}.mini-subject.mathematics{background:#f8e9ff;color:#9d42c8}.mini-subject.english{background:#fff0e5;color:#df742f}.mini-subject.hindi{background:#ffeaf5;color:#bd4f86}.material-subject-row b{font-size:10px;flex:1}.material-subject-row small{font-size:8px;color:#96929f}.material-subject-row>span:last-child{font-size:17px;color:#635bff}.material-chapters{display:grid;gap:5px;padding:0 0 9px 39px}.material-chapter{display:flex;align-items:center;gap:7px;border:1px solid #ece9f0;background:#fff;border-radius:10px;padding:7px 8px}.chapter-link{display:flex;align-items:center;gap:7px;flex:1;min-width:0;text-decoration:none;color:#3b3745}.chapter-link span{font-size:13px;color:#68a6d0}.chapter-link b{font-size:9px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.material-chapter.done{border-color:#cfeadd;background:#fbfffd}.start-button{border:1px solid #635bff;background:#635bff;color:#fff;border-radius:8px;padding:6px 8px;text-decoration:none;font-size:7px;font-weight:900;white-space:nowrap}.chapter-actions{display:flex;align-items:center;gap:5px}.chapter-actions span{font-size:7px;color:#8d8997}.chapter-actions button{border:1px solid #d9d4f5;background:#f8f7ff;color:#635bff;border-radius:7px;padding:5px 6px;font-size:7px;font-weight:900}.empty-material{padding:10px;color:#96929f;font-size:9px}
      .study-message{text-align:center;color:#635bff;font-size:9px;margin:12px}.workspace-tip{margin-top:17px;display:flex;gap:11px;padding:15px;border-radius:17px;background:linear-gradient(135deg,#29214c,#4a2d67);color:#fff}.workspace-tip>span{width:34px;height:34px;border-radius:10px;background:#ffffff1c;display:grid;place-items:center}.workspace-tip b{font-size:10px}.workspace-tip p{margin:3px 0 0;font-size:8px;line-height:1.55;color:#d0cadc}
      @keyframes studyIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @media(max-width:700px){
        .study-library{padding:12px 14px 190px}.study-topbar h1{font-size:22px}.study-topbar p{font-size:9px}.study-tabs{gap:28px;height:46px}.study-tabs button{font-size:13px}.completion-note{padding:12px;font-size:8px}.completion-note div{flex-direction:column;align-items:flex-start;gap:1px}.completion-note strong{font-size:9px}
        .subject-card{padding:13px 11px;gap:10px;border-radius:16px}.subject-icon{width:45px;height:45px;flex-basis:45px;font-size:20px}.subject-main b{font-size:14px}.subject-main small{font-size:8px}.subject-main i{height:6px;margin-top:7px}.subject-percent{width:30px;font-size:9px}.subject-arrow{font-size:25px}.xp-pill{padding:8px 10px}.xp-pill span{font-size:14px}.xp-pill b{font-size:12px}.xp-pill small{font-size:8px}
        .special-materials{grid-template-columns:1fr}.material-body{padding-left:45px}.material-chapters{padding-left:18px}.material-chapter{padding:7px 6px}.chapter-actions span{display:none}.start-button{font-size:7px;padding:6px}.material-copy small{max-width:245px}
      }
      @media(prefers-reduced-motion:reduce){.study-library,.subject-card{animation:none;transition:none}}
    `}</style>
  </main>
}
