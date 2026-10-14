"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StudyProfile = { grade: string; board: string; target: string; language: string };
const defaults: StudyProfile = { grade: "12", board: "UP Board", target: "Board + JEE", language: "Hindi + English" };

const pathways = [
  { icon: "📚", title: "Notes & chapter learning", description: "Chapter explanations, quick summaries and saved revision material.", href: "/study", action: "Open Study Library" },
  { icon: "🤖", title: "AI doubt solver", description: "Ask a concept question and request a step-by-step explanation.", href: "/ai", action: "Open AI Study" },
  { icon: "🧠", title: "Chapter MCQ tests", description: "Generate a chapter quiz, answer questions and review explanations.", href: "/quiz", action: "Start a quiz" },
  { icon: "🎯", title: "PYQ practice builder", description: "Build a trend-based practice set; generated questions are not claimed to be official PYQs.", href: "/pyq", action: "Build practice paper" },
  { icon: "⏱️", title: "Focus & study planning", description: "Plan focused sessions and keep daily learning goals visible.", href: "/focus", action: "Open focus tools" },
  { icon: "📈", title: "Progress & goals", description: "Review your learning activity and manage study goals.", href: "/goals", action: "View goals" },
];

export default function LearningPathPage() {
  const [profile, setProfile] = useState<StudyProfile>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lakshya-study-profile-v1");
      if (stored) setProfile({ ...defaults, ...JSON.parse(stored) });
    } catch { /* Keep safe defaults if local preferences are unavailable. */ }
  }, []);

  function update<K extends keyof StudyProfile>(key: K, value: StudyProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function saveProfile() {
    try {
      localStorage.setItem("lakshya-study-profile-v1", JSON.stringify(profile));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  const curriculumStatus = profile.grade === "12"
    ? "The current Study Library contains a Class 12 chapter catalogue. Check your board's latest syllabus before exam preparation."
    : "Your learning preference is saved, but a verified chapter catalogue for this class still needs to be added before lessons can be labelled as complete.";

  return (
    <main className="path-page">
      <header className="path-header">
        <Link href="/study" className="back-link">← Study Library / पढ़ाई</Link>
        <div className="eyebrow">PERSONAL LEARNING PATH • अपना स्टडी प्लान</div>
        <h1>Make your study time <span>count.</span></h1>
        <p>Choose your class, board, exam goal and language. Lakshya will keep your study shortcuts together in one place.</p>
      </header>

      <section className="profile-card">
        <div className="section-heading">
          <div><span className="section-kicker">YOUR LEARNING PROFILE</span><h2>Set your study preferences</h2></div>
          <span className="profile-mark">✦</span>
        </div>
        <div className="profile-grid">
          <label>Class / कक्षा
            <select value={profile.grade} onChange={(e) => update("grade", e.target.value)}>
              <option value="9">Class 9</option><option value="10">Class 10</option><option value="11">Class 11</option><option value="12">Class 12</option>
            </select>
          </label>
          <label>Board / बोर्ड
            <select value={profile.board} onChange={(e) => update("board", e.target.value)}>
              <option>UP Board</option><option>CBSE</option><option>Other State Board</option>
            </select>
          </label>
          <label>Exam goal / लक्ष्य
            <select value={profile.target} onChange={(e) => update("target", e.target.value)}>
              <option>Board</option><option>Board + JEE</option><option>JEE Main</option><option>JEE Advanced</option><option>NEET</option><option>Board + NEET</option>
            </select>
          </label>
          <label>Learning language / भाषा
            <select value={profile.language} onChange={(e) => update("language", e.target.value)}>
              <option>Hindi + English</option><option>Hindi</option><option>English</option><option>Hinglish</option>
            </select>
          </label>
        </div>
        <div className="profile-footer">
          <p>Saved on this device for now. Existing account and chapter-progress features remain unchanged.</p>
          <button type="button" onClick={saveProfile}>Save preferences ↗</button>
        </div>
        {saved && <p className="save-status" role="status">✓ Preferences saved on this device.</p>}
      </section>

      <section className="catalog-note">
        <span className="catalog-icon">ℹ️</span>
        <div><b>Curriculum availability</b><p>{curriculumStatus}</p><small>We will only mark syllabus coverage as complete after the relevant chapter data is verified and added.</small></div>
      </section>

      <div className="path-section-title"><div><span className="section-kicker">YOUR STUDY TOOLKIT</span><h2>Learn · Practise · Revise</h2></div><span className="tool-count">6 tools</span></div>
      <section className="pathway-grid">
        {pathways.map((item) => <article className="pathway-card" key={item.title}>
          <div className="pathway-icon" aria-hidden="true">{item.icon}</div>
          <h3>{item.title}</h3><p>{item.description}</p>
          <Link href={item.href}>{item.action} <span aria-hidden="true">→</span></Link>
        </article>)}
      </section>

      <footer className="path-footer">Lakshya • Small, consistent study sessions build strong understanding.</footer>

      <style jsx>{`
        .path-page{max-width:1080px;margin:0 auto;padding:28px 22px 80px;color:#24213b}
        .path-header{position:relative;overflow:hidden;padding:25px 26px 28px;border-radius:24px;background:radial-gradient(circle at 85% 5%,#f2dfff 0,transparent 33%),linear-gradient(125deg,#f4f1ff,#fff8fc 54%,#eff9ff);border:1px solid #e9e0f7}
        .back-link{display:inline-block;margin-bottom:22px;text-decoration:none;color:#70668e;font-size:12px;font-weight:800}
        .eyebrow,.section-kicker{font-size:10px;letter-spacing:1.4px;font-weight:900;color:#7666c6}
        .path-header h1{font-size:clamp(29px,5vw,45px);line-height:1.08;letter-spacing:-1.3px;margin:10px 0;color:#28223f}
        .path-header h1 span{color:#8757d8}.path-header>p{max-width:650px;color:#706a81;font-size:14px;line-height:1.65;margin:0}
        .profile-card{margin-top:18px;padding:22px;border:1px solid #e8e4f1;border-radius:22px;background:#fff;box-shadow:0 12px 35px #32205208}
        .section-heading,.path-section-title{display:flex;align-items:center;justify-content:space-between;gap:14px}
        .section-heading h2,.path-section-title h2{font-size:20px;margin:5px 0 0;letter-spacing:-.3px}.profile-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:#f0eaff;color:#7958cf;font-size:22px}
        .profile-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}
        .profile-grid label{display:grid;gap:8px;color:#716b80;font-size:11px;font-weight:800}
        .profile-grid select{width:100%;min-width:0;padding:12px;border:1px solid #e3dfed;border-radius:12px;background:#fcfbff;color:#302b45;font:inherit;font-size:13px;outline-color:#9274e9}
        .profile-footer{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:18px;padding-top:16px;border-top:1px solid #f0edf5}
        .profile-footer p{margin:0;color:#888195;font-size:11px;line-height:1.5}.profile-footer button{flex:none;border:0;border-radius:12px;padding:12px 16px;background:linear-gradient(100deg,#6556d9,#9b53d6);color:white;font-size:12px;font-weight:900;cursor:pointer}
        .save-status{margin:12px 0 0;color:#16805f;font-size:12px;font-weight:800}
        .catalog-note{display:flex;gap:13px;margin-top:14px;padding:16px;border:1px solid #f2dfb9;border-radius:16px;background:#fffaf0}.catalog-icon{font-size:21px}.catalog-note b{font-size:13px;color:#6e4d15}.catalog-note p{margin:5px 0;color:#7d6740;font-size:12px;line-height:1.55}.catalog-note small{font-size:10px;line-height:1.5;color:#9b8054}
        .path-section-title{margin:30px 2px 14px}.tool-count{padding:7px 10px;border-radius:999px;background:#f0edff;color:#7462c6;font-size:10px;font-weight:900}
        .pathway-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
        .pathway-card{display:flex;flex-direction:column;align-items:flex-start;min-height:190px;padding:18px;border:1px solid #e7e2f0;border-radius:18px;background:linear-gradient(145deg,#fff,#fcfaff);box-shadow:0 7px 20px #31204c08}
        .pathway-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:linear-gradient(135deg,#f0eaff,#fcecff);font-size:21px}
        .pathway-card h3{font-size:15px;margin:14px 0 6px;color:#302a45}.pathway-card p{margin:0 0 16px;color:#817b91;font-size:12px;line-height:1.6;flex:1}
        .pathway-card a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#6d55cb;font-size:12px;font-weight:900}.pathway-card a span{font-size:16px;transition:transform .15s}.pathway-card a:hover span{transform:translateX(3px)}
        .path-footer{text-align:center;color:#a09aac;font-size:11px;margin-top:30px}
        @media(max-width:800px){.profile-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pathway-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){.path-page{padding:14px 13px 100px}.path-header{padding:19px 17px 21px;border-radius:19px}.path-header>p{font-size:12px}.profile-card{padding:16px;border-radius:18px}.profile-grid{gap:10px}.profile-grid select{padding:11px 8px;font-size:12px}.profile-footer{align-items:stretch;flex-direction:column}.profile-footer button{width:100%}.pathway-grid{grid-template-columns:1fr}.pathway-card{min-height:160px}.section-heading h2,.path-section-title h2{font-size:18px}}
        @media(prefers-reduced-motion:reduce){.pathway-card a span{transition:none}}
      `}</style>
    </main>
  );
}
