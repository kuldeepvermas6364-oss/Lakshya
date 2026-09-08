const subjects = [
  { name: "Physics", code: "PHY", progress: 68, chapters: 12, done: 8, next: "Electrostatics" },
  { name: "Chemistry", code: "CHE", progress: 82, chapters: 12, done: 10, next: "Solutions" },
  { name: "Mathematics", code: "MAT", progress: 74, chapters: 12, done: 9, next: "Integrals" },
];

export default function SubjectsPage() {
  return <main className="page"><div className="hero-row"><div><p className="eyebrow">SYLLABUS</p><h1>Subjects</h1><p className="muted">Track chapters, revision and practice across your preparation.</p></div><button className="primary">+ Add subject</button></div><div className="subject-grid">{subjects.map(s=><article className="subject" key={s.name}><div className="subject-top"><div className="subject-icon">{s.code}</div><span>{s.progress}%</span></div><h3>{s.name}</h3><small>{s.done} of {s.chapters} chapters completed</small><div className="bar"><i style={{width:`${s.progress}%`}} /></div><p className="muted">Next: {s.next}</p><button className="secondary">Open subject →</button></article>)}</div></main>;
}
