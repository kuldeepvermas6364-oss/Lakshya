import Link from "next/link";
import styles from "./subject-detail.module.css";

const curriculum = {
  physics: { name: "Physics", chapters: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics & Optical Instruments", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"] },
  chemistry: { name: "Chemistry", chapters: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"] },
  mathematics: { name: "Mathematics", chapters: ["Relations & Functions", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Probability"] },
} as const;
type SubjectKey = keyof typeof curriculum;

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const data = curriculum[subject.toLowerCase() as SubjectKey];
  if (!data) return <main className="page"><h1>Subject not found</h1><p className="muted">Choose a valid Lakshya subject.</p><Link className="primary" href="/study">Back to Study</Link></main>;
  return <main className={`page ${styles.subjectDetailPage}`}>
    <div className="hero-row"><div><p className="eyebrow">LAKSHYA • CLASS 12 PCM</p><h1>{data.name}</h1><p className="muted">A focused chapter hub for concepts, practice, revision and AI-powered learning.</p></div><Link className="secondary" href="/study">← Study library</Link></div>
    <section className={styles.subjectDetailHero}><div><span>CHAPTER LIBRARY</span><h2>{data.chapters.length} chapters ready</h2><p>Choose a chapter to practise it with Lakshya AI or mark your progress in the main Study library.</p></div><Link className="primary" href={`/practice?subject=${encodeURIComponent(data.name)}&chapter=${encodeURIComponent(data.chapters[0])}`}>Practice with AI →</Link></section>
    <section className={styles.chapterGrid}>{data.chapters.map((chapter, index) => <article className={styles.chapterCard} key={chapter}><span className={styles.chapterNumber}>{String(index + 1).padStart(2, "0")}</span><div className={styles.chapterBody}><b>{chapter}</b><small>Concepts · Practice · Revision</small></div><Link className={styles.chapterArrow} href={`/practice?subject=${encodeURIComponent(data.name)}&chapter=${encodeURIComponent(chapter)}`} aria-label={`Practice ${chapter}`}>→</Link></article>)}</section>
  </main>;
}
