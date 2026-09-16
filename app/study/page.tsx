"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const subjects = {
  Physics: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics & Optical Instruments", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
  Chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
  Mathematics: ["Relations & Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Probability"],
  Hindi: ["आत्मपरिचय", "एक गीत", "पतंग", "कविता के बहाने", "कैमरे में बंद अपाहिज", "सहर्ष स्वीकारा है", "उषा", "बादल राग", "कवितावली", "लक्ष्मण-मूर्छा और राम का विलाप", "रुबाइयाँ", "छोटा मेरा खेत", "बगुलों के पंख", "सिल्वर वैडिंग", "जूझ", "अतीत में दबे पाँव", "डायरी के पन्ने"],
  English: ["The Last Lesson", "Lost Spring", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes", "The Interview", "Going Places", "My Mother at Sixty-Six", "An Elementary School Classroom in a Slum", "Keeping Quiet", "A Thing of Beauty", "A Roadside Stand", "Aunt Jennifer's Tigers", "The Third Level", "The Tiger King", "Journey to the End of the Earth", "The Enemy", "On the Face of It", "Memories of Childhood"]
} as const;

type Subject = keyof typeof subjects;
type MaterialKey = "quiz" | "notes" | "summary" | "flashcards" | "practice" | "pyq" | "tricky";

const materials: { key: MaterialKey; icon: string; title: string; desc: string }[] = [
  { key: "quiz", icon: "🧠", title: "Quiz / क्विज़", desc: "Chapter-wise MCQs & timed tests / अध्यायवार MCQ और टेस्ट" },
  { key: "notes", icon: "📝", title: "Notes / नोट्स", desc: "Detailed study notes / विस्तृत पढ़ाई के नोट्स" },
  { key: "summary", icon: "📄", title: "Summary / सारांश", desc: "Quick chapter summaries / त्वरित अध्याय सारांश" },
  { key: "flashcards", icon: "🗂️", title: "Flashcards / फ्लैशकार्ड", desc: "Fast active-recall revision / तेज़ रिवीजन" },
  { key: "practice", icon: "✍️", title: "Practice / अभ्यास", desc: "Concept & JEE-level questions / कॉन्सेप्ट और JEE-level प्रश्न" },
  { key: "pyq", icon: "📚", title: "PYQ / पिछले वर्ष के प्रश्न", desc: "Previous-year questions / पिछले वर्षों के प्रश्न" },
  { key: "tricky", icon: "⚡", title: "Tricky Questions / ट्रिकी प्रश्न", desc: "High-thinking & common traps / कठिन कॉन्सेप्ट और traps" }
];

const chapterId = (subject: Subject, chapter: string) => `${subject.toLowerCase()}-${chapter.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const chapterUrl = (subject: Subject, chapter: string) => `/study/chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;
const subjectCode: Record<Subject, string> = { Physics: "Ph", Chemistry: "Ch", Mathematics: "Ma", Hindi: "Hi", English: "En" };

export default function StudyPage() {
  const [tab, setTab] = useState<"chapters" | "materials">("chapters");
  const [openMaterial, setOpenMaterial] = useState<MaterialKey | null>(null);
  const [openSubject, setOpenSubject] = useState<Subject | null>(null);
  const [search, setSearch] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    (async () => {
      try {
        const [{ auth }, { onAuthStateChanged }] = await Promise.all([import("@/lib/firebase"), import("firebase/auth")]);
        if (!active) return;
        unsubscribe = onAuthStateChanged(auth, user => active && setUid(user?.uid ?? null), () => active && setUid(null));
      } catch { if (active) setUid(null); }
    })();
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!uid) { setProgress({}); return; }
    let active = true;
    let unsubscribe = () => {};
    (async () => {
      try {
        const [{ realtimeDb }, { onValue, ref }] = await Promise.all([import("@/lib/firebase"), import("firebase/database")]);
        if (!active) return;
        unsubscribe = onValue(ref(realtimeDb, `users/${uid}/chapterProgress`), snap => {
          if (!active) return;
          const next: Record<string, number> = {};
          if (snap.exists()) Object.entries(snap.val() as Record<string, unknown>).forEach(([id, value]) => { next[id] = Math.max(0, Math.min(100, Number((value as { progress?: number })?.progress ?? value) || 0)); });
          setProgress(next);
        }, e => active && setMessage(e.message));
      } catch (e) { if (active) setMessage(e instanceof Error ? e.message : "Firebase is temporarily unavailable."); }
    })();
    return () => { active = false; unsubscribe(); };
  }, [uid]);

  const totalChapters = useMemo(() => Object.values(subjects).reduce((n, list) => n + list.length, 0), []);
  const completedChapters = Object.values(progress).filter(v => v >= 100).length;
  const overallProgress = totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0;

  async function toggleComplete(subject: Subject, chapter: string) {
    if (!uid) { setMessage("Sign in करें / Sign in to save your chapter progress."); return; }
    const id = chapterId(subject, chapter);
    const next = progress[id] >= 100 ? 0 : 100;
    try {
      const { updateChapterProgress } = await import("@/lib/study-storage");
      await updateChapterProgress(uid, id, next);
      setMessage(next ? `${chapter} completed / पूरा mark हुआ।` : `${chapter} reopened / फिर से खोला गया।`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save progress / Progress save नहीं हुआ।"); }
  }

  function toggleMaterial(key: MaterialKey) {
    setOpenMaterial(openMaterial === key ? null : key);
    setOpenSubject(null);
  }

  return <main className="study-library">
    <header className="study-topbar">
      <Link href="/" className="study-back">←</Link>
      <div><h1>Study / पढ़ाई</h1><p>Class 12 • PCM + Languages</p></div>
      <div className="xp-pill">✦ <b>{overallProgress}%</b><small>progress</small></div>
    </header>

    <nav className="study-tabs" aria-label="Study sections">
      <button className={tab === "chapters" ? "active" : ""} onClick={() => setTab("chapters")}>Chapters</button>
      <button className={tab === "materials" ? "active" : ""} onClick={() => setTab("materials")}>Study Material</button>
    </nav>

    {tab === "chapters" ? <>
      <section className="completion-note"><b>Completion %</b> depends on your chapter progress! <span>{completedChapters}/{totalChapters} completed</span></section>
      <div className="subject-list">
        {(Object.keys(subjects) as Subject[]).map(subject => {
          const done = subjects[subject].filter(ch => progress[chapterId(subject, ch)] >= 100).length;
          const pct = subjects[subject].length ? Math.round((done / subjects[subject].length) * 100) : 0;
          return <Link href={`/study/${subject.toLowerCase()}`} className="subject-card" key={subject}>
            <span className={`subject-code ${subject.toLowerCase()}`}>{subjectCode[subject]}</span>
            <span className="subject-main"><b>{subject}</b><small>{done}/{subjects[subject].length} chapters completed</small></span>
            <span className="subject-progress"><b>{pct}%</b><i><em style={{ width: `${pct}%` }} /></i></span>
            <span className="subject-arrow">›</span>
          </Link>;
        })}
      </div>
    </> : <>
      <section className="material-head">
        <div><p className="eyebrow">STUDY MATERIAL / पढ़ाई सामग्री</p><h2>Learn, practise & revise</h2><p>Quiz, Notes, Summary, Flashcards, Practice, PYQ और Tricky Questions — सब एक ही clean format में.</p></div>
      </section>

      <div className="material-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chapters / chapters खोजें..." /></div>

      <div className="special-materials">
        <Link href="/study/ncert" className="special-card"><span>📚</span><div><b>NCERT Library / NCERT लाइब्रेरी</b><small>Class 12 official chapter material</small></div><strong>→</strong></Link>
        <Link href="/study/pyq" className="special-card"><span>📑</span><div><b>PYQ & Practice Center</b><small>UPMSP + JEE Main • MCQ / Full Paper / Short Question</small></div><strong>→</strong></Link>
      </div>

      <section className="material-list">
        {materials.map(item => {
          const isOpen = openMaterial === item.key;
          return <div className={`material-card ${isOpen ? "open" : ""}`} key={item.key}>
            <button className="material-row" onClick={() => toggleMaterial(item.key)}>
              <span className="material-icon">{item.icon}</span><span className="material-copy"><b>{item.title}</b><small>{item.desc}</small></span><span className="material-arrow">{isOpen ? "⌄" : "›"}</span>
            </button>
            {isOpen && <div className="material-body">
              {(Object.keys(subjects) as Subject[]).map(subject => {
                const visible = subjects[subject].filter(ch => ch.toLowerCase().includes(search.toLowerCase()));
                const subjectDone = subjects[subject].filter(ch => progress[chapterId(subject, ch)] >= 100).length;
                const subjectOpen = openSubject === subject;
                return <div className="material-subject" key={subject}>
                  <button className="material-subject-row" onClick={() => setOpenSubject(subjectOpen ? null : subject)}><span className="mini-folder">📁</span><b>{subject}</b><small>{subjectDone}/{subjects[subject].length} done / पूरे</small><span>{subjectOpen ? "⌄" : "›"}</span></button>
                  {subjectOpen && <div className="material-chapters">{visible.map(chapter => {
                    const done = progress[chapterId(subject, chapter)] >= 100;
                    const workspace = chapterUrl(subject, chapter);
                    const action = item.key === "quiz" ? `/quiz?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}` : workspace;
                    return <div className={`material-chapter ${done ? "done" : ""}`} key={chapter}>
                      <Link href={action} className="chapter-link"><span>{done ? "✓" : "📄"}</span><b>{chapter}</b></Link>
                      {item.key === "quiz" ? <Link href={action} className="start-button">Start MCQ / MCQ शुरू</Link> : <div className="chapter-actions"><span>{done ? "Completed / पूरा" : "Not started / शुरू नहीं"}</span><button onClick={() => toggleComplete(subject, chapter)}>{done ? "Reopen" : "Mark done"}</button></div>}
                    </div>;
                  })}{visible.length === 0 && <p className="empty-material">No matching chapters / कोई matching chapter नहीं मिला।</p>}</div>}
                </div>;
              })}
            </div>}
          </div>;
        })}
      </section>
    </>}

    {message && <p className="study-message">{message}</p>}

    <section className="workspace-tip"><span>✦</span><div><b>Chapter Workspace / अध्याय वर्कस्पेस</b><p>Chapter खोलकर Lakshya AI से पढ़ो और किसी भी useful explanation को MCQ, Flashcard, Key Point या Quick Revision में permanently save करो.</p></div></section>

    <style jsx>{`
      .study-library{max-width:1080px;margin:0 auto;padding:18px 28px 70px;min-height:100vh;background:linear-gradient(145deg,#fbfaff 0%,#f6f3ff 48%,#fff5fb 100%);animation:studyIn .35s ease both}
      .study-topbar{display:flex;align-items:center;gap:13px;padding:4px 0 15px}.study-back{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.72);border:1px solid #e6e1f3;text-decoration:none;color:#45404f;font-size:25px}.study-topbar h1{margin:0;font-size:25px;letter-spacing:-.7px;color:#25243a}.study-topbar p{margin:2px 0 0;font-size:10px;color:#9290a0}.xp-pill{margin-left:auto;display:flex;align-items:center;gap:5px;padding:9px 12px;border-radius:18px;background:rgba(255,255,255,.8);border:1px solid #e3def1;color:#635bff}.xp-pill b{font-size:13px}.xp-pill small{font-size:8px;color:#9a96a8}
      .study-tabs{display:flex;gap:35px;height:48px;border-bottom:1px solid #e5e1ed;margin-bottom:14px}.study-tabs button{position:relative;border:0;background:transparent;padding:0 0 12px;font-size:14px;font-weight:900;color:#777487;cursor:pointer}.study-tabs button.active{color:#635bff}.study-tabs button.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:3px;border-radius:5px;background:#635bff}
      .completion-note{padding:13px 15px;border-radius:12px;background:#fff7e8;border:1px solid #f2dfbd;color:#55505b;font-size:10px;margin-bottom:12px}.completion-note b{color:#292532}.completion-note span{float:right;color:#635bff;font-weight:900}
      .subject-list{display:grid;gap:10px}.subject-card{display:flex;align-items:center;gap:13px;padding:15px 16px;border:1px solid #e4e1e9;border-radius:17px;background:rgba(255,255,255,.9);text-decoration:none;color:#282633;box-shadow:0 5px 20px rgba(62,52,112,.045);transition:.22s ease}.subject-card:hover{transform:translateY(-2px);border-color:#cbc4ff;box-shadow:0 10px 26px rgba(78,65,160,.1)}.subject-code{width:50px;height:50px;flex:none;border-radius:14px;display:grid;place-items:center;background:#edf6ff;color:#2864b9;font-size:19px;font-weight:900}.subject-code.chemistry{background:#e9fbf7;color:#1d8b6c}.subject-code.mathematics{background:#fff0f7;color:#b84f89}.subject-code.hindi{background:#fff4df;color:#b87818}.subject-code.english{background:#eeeaff;color:#6d55c9}.subject-main{flex:1;min-width:0}.subject-main b{display:block;font-size:15px}.subject-main small{display:block;color:#92909c;font-size:9px;margin-top:4px}.subject-progress{width:72px;text-align:right}.subject-progress b{font-size:11px;color:#5d5966}.subject-progress i{display:block;height:6px;background:#e7e5eb;border-radius:99px;margin-top:5px;overflow:hidden}.subject-progress em{display:block;height:100%;background:#48c78a;border-radius:99px}.subject-arrow{font-size:27px;color:#8b8793;margin-left:3px}
      .material-head{padding:8px 2px 10px}.eyebrow{margin:0 0 3px;font-size:8px;font-weight:900;letter-spacing:1.1px;color:#7c73c8}.material-head h2{margin:0;font-size:22px;color:#29263b}.material-head p:last-child{margin:4px 0 0;max-width:700px;color:#8b8797;font-size:10px;line-height:1.55}.material-search{height:46px;display:flex;align-items:center;gap:10px;padding:0 14px;background:#fff;border:1px solid #ddd9e6;border-radius:13px;margin:5px 0 13px}.material-search span{font-size:22px;color:#8b8794}.material-search input{flex:1;border:0;outline:0;background:transparent;font-size:11px;color:#333}.special-materials{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:13px}.special-card{display:flex;align-items:center;gap:11px;padding:13px 14px;border:1px solid #dcd6fa;border-radius:15px;background:linear-gradient(110deg,#fff,#f8f6ff 65%,#fff5fb);text-decoration:none;color:#29263b}.special-card>span{width:40px;height:40px;border-radius:12px;background:#eeebff;display:grid;place-items:center;font-size:20px}.special-card div{flex:1;min-width:0}.special-card b,.special-card small{display:block}.special-card b{font-size:11px}.special-card small{font-size:8px;color:#898594;margin-top:3px;line-height:1.4}.special-card strong{color:#635bff;font-size:20px}
      .material-list{display:grid;gap:9px}.material-card{border:1px solid #e2dfe8;border-radius:16px;background:rgba(255,255,255,.92);overflow:hidden;box-shadow:0 5px 18px rgba(50,42,90,.045)}.material-card.open{border-color:#cfc8ff}.material-row{width:100%;display:flex;align-items:center;gap:12px;padding:14px 15px;border:0;background:transparent;text-align:left;cursor:pointer}.material-icon{width:43px;height:43px;border-radius:13px;background:#f0edff;display:grid;place-items:center;font-size:21px;flex:none}.material-copy{flex:1}.material-copy b,.material-copy small{display:block}.material-copy b{font-size:13px;color:#292735}.material-copy small{font-size:8px;color:#8f8b9b;margin-top:3px;line-height:1.45}.material-arrow{font-size:23px;color:#635bff}.material-body{padding:0 12px 12px 68px;background:#fbfaff}.material-subject{border-top:1px solid #ece9f1}.material-subject-row{width:100%;display:flex;align-items:center;gap:9px;padding:10px 5px;border:0;background:transparent;text-align:left;cursor:pointer}.mini-folder{width:28px;height:28px;border-radius:8px;background:#eeecff;display:grid;place-items:center;font-size:14px}.material-subject-row b{font-size:10px;flex:1}.material-subject-row small{font-size:8px;color:#96929f}.material-subject-row>span:last-child{font-size:17px;color:#635bff}.material-chapters{display:grid;gap:5px;padding:0 0 9px 36px}.material-chapter{display:flex;align-items:center;gap:7px;border:1px solid #ece9f0;background:#fff;border-radius:10px;padding:7px 8px}.chapter-link{display:flex;align-items:center;gap:7px;flex:1;min-width:0;text-decoration:none;color:#3b3745}.chapter-link span{font-size:13px;color:#68a6d0}.chapter-link b{font-size:9px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.material-chapter.done{border-color:#cfeadd;background:#fbfffd}.start-button{border:1px solid #635bff;background:#635bff;color:#fff;border-radius:8px;padding:6px 8px;text-decoration:none;font-size:7px;font-weight:900;white-space:nowrap}.chapter-actions{display:flex;align-items:center;gap:5px}.chapter-actions span{font-size:7px;color:#8d8997}.chapter-actions button{border:1px solid #d9d4f5;background:#f8f7ff;color:#635bff;border-radius:7px;padding:5px 6px;font-size:7px;font-weight:900}.empty-material{padding:10px;color:#96929f;font-size:9px}
      .study-message{text-align:center;color:#635bff;font-size:9px;margin:12px}.workspace-tip{margin-top:17px;display:flex;gap:11px;padding:15px;border-radius:16px;background:linear-gradient(135deg,#29214c,#4a2d67);color:#fff}.workspace-tip>span{width:32px;height:32px;border-radius:9px;background:#ffffff1c;display:grid;place-items:center}.workspace-tip b{font-size:10px}.workspace-tip p{margin:3px 0 0;font-size:8px;line-height:1.55;color:#d0cadc}
      @keyframes studyIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      @media(max-width:700px){.study-library{padding:12px 14px 86px}.study-topbar h1{font-size:22px}.study-tabs{gap:28px}.study-tabs button{font-size:13px}.completion-note{font-size:9px}.subject-card{padding:13px 11px;gap:10px}.subject-code{width:44px;height:44px;font-size:17px}.subject-main b{font-size:13px}.subject-progress{width:60px}.subject-arrow{font-size:24px}.special-materials{grid-template-columns:1fr}.material-body{padding-left:45px}.material-chapters{padding-left:18px}.material-chapter{padding:7px 6px}.chapter-actions span{display:none}.start-button{font-size:7px;padding:6px}.material-copy small{max-width:240px}.xp-pill{padding:8px 9px}}
      @media(prefers-reduced-motion:reduce){.study-library,.subject-card{animation:none;transition:none}}
    `}</style>
  </main>;
}
