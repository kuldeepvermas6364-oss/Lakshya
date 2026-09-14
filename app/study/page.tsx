"use client";

import { useEffect, useMemo, useState } from "react";

const subjects = {
  Physics: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics & Optical Instruments", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
  Chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
  Mathematics: ["Relations & Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Probability"],
  Hindi: ["आत्मपरिचय", "एक गीत", "पतंग", "कविता के बहाने", "कैमरे में बंद अपाहिज", "सहर्ष स्वीकारा है", "उषा", "बादल राग", "कवितावली", "लक्ष्मण-मूर्छा और राम का विलाप", "रुबाइयाँ", "छोटा मेरा खेत", "बगुलों के पंख", "सिल्वर वैडिंग", "जूझ", "अतीत में दबे पाँव", "डायरी के पन्ने"],
  English: ["The Last Lesson", "Lost Spring", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes", "The Interview", "Going Places", "My Mother at Sixty-Six", "An Elementary School Classroom in a Slum", "Keeping Quiet", "A Thing of Beauty", "A Roadside Stand", "Aunt Jennifer's Tigers", "The Third Level", "The Tiger King", "Journey to the End of the Earth", "The Enemy", "On the Face of It", "Memories of Childhood"]
} as const;

type Subject = keyof typeof subjects;
const folders = [
  { key: "quiz", icon: "🧠", title: "Quiz", desc: "Chapter-wise MCQs & timed tests" },
  { key: "notes", icon: "📝", title: "Notes", desc: "Detailed study notes" },
  { key: "summary", icon: "📄", title: "Summary", desc: "Quick chapter summaries" },
  { key: "flashcards", icon: "🗂️", title: "Flashcards", desc: "Fast active-recall revision" },
  { key: "practice", icon: "✍️", title: "Practice", desc: "Concept & JEE-level questions" },
  { key: "pyq", icon: "📚", title: "PYQ", desc: "Previous-year questions" },
  { key: "tricky", icon: "⚡", title: "Tricky Questions", desc: "High-thinking & common traps" }
] as const;

const chapterId = (subject: Subject, chapter: string) => `${subject.toLowerCase()}-${chapter.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const chapterUrl = (subject: Subject, chapter: string) => `/study/chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;

export default function StudyPage() {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
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
        unsubscribe = onAuthStateChanged(auth, user => { if (active) setUid(user?.uid ?? null); }, () => { if (active) setUid(null); });
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
        }, e => { if (active) setMessage(e.message); });
      } catch (e) { if (active) setMessage(e instanceof Error ? e.message : "Firebase is temporarily unavailable."); }
    })();
    return () => { active = false; unsubscribe(); };
  }, [uid]);

  const totalChapters = useMemo(() => Object.values(subjects).reduce((n, list) => n + list.length, 0), []);
  const completedChapters = Object.values(progress).filter(v => v >= 100).length;
  const overallProgress = totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const toggleFolder = (key: string) => setOpenFolder(openFolder === key ? null : key);
  const toggleSubject = (subject: Subject) => setOpenSubject(openSubject === subject ? null : subject);

  async function toggleComplete(subject: Subject, chapter: string) {
    if (!uid) { setMessage("Sign in to save your chapter progress."); return; }
    const id = chapterId(subject, chapter);
    const next = progress[id] >= 100 ? 0 : 100;
    try {
      const { updateChapterProgress } = await import("@/lib/study-storage");
      await updateChapterProgress(uid, id, next);
      setMessage(next ? `${chapter} marked complete.` : `${chapter} reopened.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save progress."); }
  }

  return <main className="study-explorer">
    <section className="study-explorer-head"><div><p className="eyebrow">LAKSHYA • STUDY LIBRARY</p><h1>Study</h1><p className="muted">Har chapter ke andar AI ke saath padho. Kisi bhi useful point ko MCQ, Flashcard, Key Point ya Quick Revision mein save karo — woh tumhare account mein rahega.</p></div><div className="study-stats"><b>{Object.keys(subjects).length}</b><span>Subjects</span><b>{totalChapters}</b><span>Chapters</span></div></section>
    <div className="study-progress-card"><div><span>Your real chapter progress</span><b>{completedChapters}/{totalChapters} completed</b></div><div className="study-progress-track"><i style={{ width: `${overallProgress}%` }} /></div><small>{uid ? `${overallProgress}% recorded in your Firebase account` : "Sign in to save progress across devices"}</small></div>
    <div className="study-explorer-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search folders or chapters..." /></div>
    <section className="folder-list">{folders.map(folder => {
      const isOpen = openFolder === folder.key;
      return <div className={`study-folder ${isOpen ? "folder-open" : ""}`} key={folder.key}>
        <button className="folder-row" onClick={() => toggleFolder(folder.key)}><span className="folder-icon">{folder.icon}</span><span className="folder-copy"><b>{folder.title}</b><small>{folder.desc}</small></span><span className="folder-arrow">{isOpen ? "⌄" : "›"}</span></button>
        {isOpen && <div className="subject-tree">{(Object.keys(subjects) as Subject[]).map(subject => {
          const visible = subjects[subject].filter(ch => ch.toLowerCase().includes(search.toLowerCase()));
          const subjectOpen = openSubject === subject;
          const subjectDone = subjects[subject].filter(ch => progress[chapterId(subject, ch)] >= 100).length;
          return <div className="subject-folder" key={subject}>
            <button className="subject-row" onClick={() => toggleSubject(subject)}><span className={`subject-folder-icon ${subject.toLowerCase()}`}>📁</span><b>{subject}</b><small>{subjectDone}/{subjects[subject].length} done</small><span>{subjectOpen ? "⌄" : "›"}</span></button>
            {subjectOpen && <div className="chapter-tree">{visible.map(chapter => {
              const done = progress[chapterId(subject, chapter)] >= 100;
              return <div className={`chapter-file ${done ? "chapter-done" : ""}`} key={chapter}>
                <button className="chapter-open" type="button" onClick={() => { window.location.href = chapterUrl(subject, chapter); }}><span>{done ? "✓" : "📄"}</span><span>{chapter}</span></button>
                {folder.key === "quiz" ? <button className="folder-action" type="button" onClick={() => { window.location.href = `/quiz?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`; }}>Start MCQ</button> : <><em>{done ? "Completed" : "Not started"}</em><button type="button" onClick={() => toggleComplete(subject, chapter)}>{done ? "Reopen" : "Mark done"}</button></>}
              </div>;
            })}{visible.length === 0 && <div className="empty-tree">No matching chapters.</div>}</div>}
          </div>;
        })}</div>}
      </div>;
    })}</section>
    {message && <p className="study-status">{message}</p>}
    <section className="study-info-card"><div className="info-icon">✦</div><div><b>Chapter Workspace</b><p>Chapter open karte hi dedicated AI learning space milega. AI se padhte waqt point ko category mein save karo; saved items Firebase mein rahenge aur download karne par bhi automatically delete nahi honge.</p></div></section>
    <style jsx>{` .study-explorer{max-width:1080px;margin:0 auto;padding:32px 34px 60px;animation:riseIn .4s ease both}.study-explorer-head{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;margin-bottom:18px}.study-explorer-head h1{font-size:36px;letter-spacing:-1.5px;margin:0;background:linear-gradient(100deg,#171a2b,#635bff 58%,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent}.muted{color:#858b9a;font-size:11px;line-height:1.6}.study-stats{display:grid;grid-template-columns:auto auto;gap:2px 9px;min-width:135px;padding:12px 15px;border:1px solid #e5e7ef;border-radius:16px;background:#fff}.study-stats b{font-size:17px;color:#635bff}.study-stats span{font-size:9px;color:#8a91a0}.study-progress-card{margin-bottom:14px;padding:14px 16px;border:1px solid #e2defd;border-radius:16px;background:#fff}.study-progress-card>div:first-child{display:flex;justify-content:space-between}.study-progress-card span{font-size:10px;color:#858b9a}.study-progress-card b{font-size:11px;color:#635bff}.study-progress-track{height:7px;border-radius:99px;background:#eceaf5;margin:9px 0 6px;overflow:hidden}.study-progress-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#635bff,#b94cff);transition:width .5s ease}.study-progress-card small{font-size:8px;color:#969cab}.study-explorer-search{height:46px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e3e6ee;border-radius:13px;padding:0 14px;margin-bottom:14px}.study-explorer-search input{flex:1;border:0;outline:0;background:transparent;font-size:12px}.folder-list{display:grid;gap:9px}.study-folder{border:1px solid #e3e6ed;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 6px 22px rgba(38,44,90,.045)}.folder-open{border-color:#cfcaff}.folder-row{width:100%;display:flex;align-items:center;gap:13px;text-align:left;border:0;background:transparent;padding:15px 17px;cursor:pointer}.folder-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#f1efff;font-size:20px}.folder-copy{flex:1}.folder-copy b,.folder-copy small{display:block}.folder-copy b{font-size:13px}.folder-copy small{font-size:9px;color:#8b92a1;margin-top:3px}.folder-arrow{font-size:22px;color:#635bff}.subject-tree{padding:0 12px 12px 70px;background:#fbfbff}.subject-folder{border-top:1px solid #edf0f4}.subject-row{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;padding:11px 7px;text-align:left;color:#22283a;cursor:pointer}.subject-row b{font-size:11px;flex:1}.subject-row small{font-size:8px;color:#9298a6}.subject-row>span:last-child{font-size:18px;color:#635bff}.subject-folder-icon{width:29px;height:29px;border-radius:8px;display:grid;place-items:center;background:#eeecff;font-size:14px}.subject-folder-icon.chemistry{background:#e9fbfd}.subject-folder-icon.mathematics{background:#fcecf6}.subject-folder-icon.hindi{background:#fff3df}.subject-folder-icon.english{background:#eaf5ff}.chapter-tree{display:grid;gap:5px;padding:0 0 10px 38px}.chapter-file{width:100%;display:flex;align-items:center;gap:8px;border:1px solid #eceef3;background:#fff;border-radius:10px;padding:7px 8px}.chapter-open{display:flex;align-items:center;gap:8px;flex:1;min-width:0;border:0;background:none;text-align:left;padding:2px;cursor:pointer}.chapter-open span:last-child{font-size:10px;color:#343a4a;overflow:hidden;text-overflow:ellipsis}.chapter-file em{font-style:normal;font-size:8px;font-weight:800;color:#635bff}.chapter-file button:not(.chapter-open){border:1px solid #d9d5ff;background:#f8f7ff;color:#635bff;border-radius:8px;padding:5px 7px;font-size:7px;font-weight:800;cursor:pointer;white-space:nowrap}.folder-action{border:1px solid #635bff!important;background:#635bff!important;color:#fff!important}.chapter-done{border-color:#cfcaff;background:#faf9ff}.empty-tree{font-size:10px;color:#9298a6;padding:10px}.study-status{text-align:center;font-size:10px;color:#635bff;margin:12px 0}.study-info-card{margin-top:16px;display:flex;gap:12px;padding:17px 18px;border-radius:16px;background:linear-gradient(135deg,#19172f,#29234d);color:#fff}.info-icon{width:34px;height:34px;border-radius:10px;background:#ffffff1f;display:grid;place-items:center}.study-info-card b{font-size:11px}.study-info-card p{font-size:9px;color:#c4c5d2;line-height:1.6;margin:4px 0 0}@media(max-width:700px){.study-explorer{padding:22px 14px 92px}.study-explorer-head{align-items:flex-start;flex-direction:column}.study-explorer-head h1{font-size:30px}.study-stats{width:100%;grid-template-columns:1fr 1fr 1fr 1fr}.study-progress-card>div:first-child{align-items:flex-start;flex-direction:column;gap:3px}.subject-tree{padding-left:48px}.chapter-tree{padding-left:20px}.chapter-file{padding:8px 6px;gap:5px}.chapter-file em{display:none}.chapter-file button:not(.chapter-open){font-size:7px;padding:5px 6px}.folder-row{padding:14px}.folder-icon{width:38px;height:38px}}`}</style>
  </main>;
}
