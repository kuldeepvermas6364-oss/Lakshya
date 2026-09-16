"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./subject-detail.module.css";

const curriculum = {
  physics: { name: "Physics", chapters: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics & Optical Instruments", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"] },
  chemistry: { name: "Chemistry", chapters: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"] },
  mathematics: { name: "Mathematics", chapters: ["Relations & Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Probability"] },
} as const;

type Material = "quiz" | "notes" | "summary" | "flashcards" | "practice" | "pyq" | "tricky";
const materialInfo: { key: Material; icon: string; title: string; desc: string }[] = [
  { key: "quiz", icon: "🧠", title: "Quiz / क्विज़", desc: "Chapter-wise MCQs & timed tests" },
  { key: "notes", icon: "📝", title: "Notes / नोट्स", desc: "Detailed chapter notes" },
  { key: "summary", icon: "📄", title: "Summary / सारांश", desc: "Quick revision summaries" },
  { key: "flashcards", icon: "🗂️", title: "Flashcards / फ्लैशकार्ड", desc: "Active-recall revision" },
  { key: "practice", icon: "✍️", title: "Practice / अभ्यास", desc: "Concept & JEE-level questions" },
  { key: "pyq", icon: "📚", title: "PYQ / पिछले वर्ष के प्रश्न", desc: "Previous-year questions" },
  { key: "tricky", icon: "⚡", title: "Tricky Questions / ट्रिकी प्रश्न", desc: "High-thinking questions & traps" },
];

export default function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const [subjectKey, setSubjectKey] = useState<keyof typeof curriculum>("physics");
  const [tab, setTab] = useState<"chapters" | "materials">("chapters");
  const [openMaterial, setOpenMaterial] = useState<Material | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    params.then(({ subject }) => {
      if (subject.toLowerCase() in curriculum) setSubjectKey(subject.toLowerCase() as keyof typeof curriculum);
    });
  }, [params]);

  const data = curriculum[subjectKey];
  const chapterId = (chapter: string) => `${data.name.toLowerCase()}-${chapter.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  useEffect(() => {
    let active = true;
    let stop = () => {};
    (async () => {
      try {
        const [{ auth }, { onAuthStateChanged }] = await Promise.all([import("@/lib/firebase"), import("firebase/auth")]);
        stop = onAuthStateChanged(auth, async user => {
          if (!user || !active) { if (active) setProgress({}); return; }
          const [{ realtimeDb }, { onValue, ref }] = await Promise.all([import("@/lib/firebase"), import("firebase/database")]);
          if (!active) return;
          const path = `users/${user.uid}/chapterProgress`;
          return onValue(ref(realtimeDb, path), snap => {
            if (!active) return;
            const next: Record<string, number> = {};
            if (snap.exists()) Object.entries(snap.val() as Record<string, unknown>).forEach(([id, value]) => { next[id] = Number((value as { progress?: number })?.progress ?? value) || 0; });
            setProgress(next);
          });
        });
      } catch { if (active) setProgress({}); }
    })();
    return () => { active = false; stop(); };
  }, [subjectKey]);

  const done = useMemo(() => data.chapters.filter(ch => progress[chapterId(ch)] >= 100).length, [data.chapters, progress]);
  const percent = data.chapters.length ? Math.round((done / data.chapters.length) * 100) : 0;

  if (!data) return <main className="page"><h1>Subject not found</h1><Link className="primary" href="/study">Back to Study</Link></main>;

  return <main className={`page ${styles.subjectDetailPage}`}>
    <header className={styles.subjectHeader}>
      <Link href="/study" className={styles.back}>←</Link>
      <div><h1>{data.name}</h1><p>Class 12 • {data.chapters.length} chapters</p></div>
      <div className={styles.progressPill}><b>{percent}%</b><small>{done}/{data.chapters.length} done</small></div>
    </header>

    <nav className={styles.tabs}>
      <button className={tab === "chapters" ? styles.activeTab : ""} onClick={() => setTab("chapters")}>Chapters</button>
      <button className={tab === "materials" ? styles.activeTab : ""} onClick={() => setTab("materials")}>Study Material</button>
    </nav>

    {tab === "chapters" ? <>
      <div className={styles.infoBar}><span>Completion % depends on lecture & chapter progress!</span><b>{done}/{data.chapters.length} completed</b></div>
      <section className={styles.chapterList}>
        {data.chapters.map((chapter, index) => {
          const completed = progress[chapterId(chapter)] >= 100;
          return <article className={`${styles.chapterCard} ${completed ? styles.completed : ""}`} key={chapter}>
            <span className={styles.chapterNumber}>CH - {String(index + 1).padStart(2, "0")}</span>
            <Link href={`/study/chapter?subject=${encodeURIComponent(data.name)}&chapter=${encodeURIComponent(chapter)}`} className={styles.chapterBody}>
              <b>{chapter}</b><small>Concepts · AI Learning · Practice · Revision</small>
            </Link>
            <span className={styles.chapterProgress}>{completed ? "✓" : `${progress[chapterId(chapter)] || 0}%`}</span>
            <Link href={`/study/chapter?subject=${encodeURIComponent(data.name)}&chapter=${encodeURIComponent(chapter)}`} className={styles.chapterArrow}>›</Link>
          </article>;
        })}
      </section>
    </> : <>
      <section className={styles.materialIntro}><p>STUDY MATERIAL / पढ़ाई सामग्री</p><h2>{data.name} • Learn, practise & revise</h2><span>Har material ko chapter-wise open karo — same clean format, fast navigation.</span></section>
      <section className={styles.materialList}>
        {materialInfo.map(item => {
          const open = openMaterial === item.key;
          return <div className={`${styles.materialCard} ${open ? styles.materialOpen : ""}`} key={item.key}>
            <button className={styles.materialRow} onClick={() => setOpenMaterial(open ? null : item.key)}><span className={styles.materialIcon}>{item.icon}</span><span><b>{item.title}</b><small>{item.desc}</small></span><strong>{open ? "⌄" : "›"}</strong></button>
            {open && <div className={styles.materialChapters}>{data.chapters.map((chapter, index) => {
              const href = item.key === "quiz" ? `/quiz?subject=${encodeURIComponent(data.name)}&chapter=${encodeURIComponent(chapter)}` : `/study/chapter?subject=${encodeURIComponent(data.name)}&chapter=${encodeURIComponent(chapter)}`;
              return <div className={styles.materialChapter} key={chapter}><Link href={href}><span>📄</span><b>{String(index + 1).padStart(2, "0")} · {chapter}</b></Link>{item.key === "quiz" ? <Link href={href} className={styles.startButton}>Start MCQ</Link> : <Link href={href} className={styles.openButton}>Open</Link>}</div>;
            })}</div>}
          </div>;
        })}
      </section>
    </>}
  </main>;
}
