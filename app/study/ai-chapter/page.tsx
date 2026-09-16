"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref, remove, set } from "firebase/database";
import { auth, realtimeDb } from "../../../lib/firebase";

type Category = "quiz" | "notes" | "summary" | "flashcards" | "practice" | "pyq" | "tricky";
type SavedItem = { id: string; text: string; createdAt: number; category?: Category };
type Workspace = Record<Category, Record<string, SavedItem>>;

const emptyWorkspace = (): Workspace => ({ quiz: {}, notes: {}, summary: {}, flashcards: {}, practice: {}, pyq: {}, tricky: {} });
const materialInfo: Record<Category, { icon: string; title: string; description: string; instruction: string }> = {
  quiz: { icon: "🧠", title: "Quiz / क्विज़", description: "AI chapter MCQs + explanations", instruction: "Create 5 exam-quality MCQs from this chapter. Give four options A-D, correct answer and a short explanation. Clearly label them as AI-generated practice, not official past-paper questions." },
  notes: { icon: "📝", title: "Notes / नोट्स", description: "AI-assisted detailed chapter notes", instruction: "Create concise but complete Class 12 chapter notes. Include definitions, concepts, important formulas/reactions, diagrams to remember, common mistakes and exam tips. Use Hindi as primary language with necessary English scientific terms." },
  summary: { icon: "📄", title: "Summary / सारांश", description: "Quick chapter revision", instruction: "Create a high-value quick revision summary: key concepts, formulas/reactions, important facts and last-minute exam reminders. Keep it compact and Hindi-first." },
  flashcards: { icon: "🗂️", title: "Flashcards / फ्लैशकार्ड", description: "Active recall cards", instruction: "Create 8 active-recall flashcards. Format each as Front: question/concept and Back: answer. Hindi-first, with scientific terms in English where useful." },
  practice: { icon: "✍️", title: "Practice / अभ्यास", description: "Concept + JEE-level practice", instruction: "Create 5 chapter practice questions progressing from concept to JEE-level. Include answer and short solution. Do not invent an official exam source." },
  pyq: { icon: "📚", title: "PYQ / पिछले वर्ष के प्रश्न", description: "PYQ-style chapter practice", instruction: "Create 5 PYQ-style questions based on this chapter. Do NOT claim they are real official PYQs unless supplied in the prompt. Label them AI-generated PYQ-style practice and include answers with short explanations." },
  tricky: { icon: "⚡", title: "Tricky Questions / ट्रिकी प्रश्न", description: "Common traps + high-thinking practice", instruction: "Create 5 tricky/high-thinking questions from this chapter, focused on common traps and misconceptions. Include correct answer and why the trap is wrong." },
};

const chapterLists: Record<string, string[]> = {
  Physics: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
  Chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
  Biology: ["Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Ecology and Environment"],
};

function ncertBookUrl(subject: string, chapter: string) {
  const index = Math.max(0, (chapterLists[subject] || []).indexOf(chapter));
  if (subject === "Physics") return index < 8 ? "https://ncert.nic.in/textbook/pdf/lhph1ps.pdf" : "https://ncert.nic.in/textbook/pdf/lhph2ps.pdf";
  if (subject === "Biology") return "https://ncert.nic.in/textbook/pdf/lhbo1ps.pdf";
  if (subject === "Chemistry") return index < 5 ? "https://ncert.nic.in/textbook.php?lech1=0-5&ln=hi" : "https://ncert.nic.in/textbook.php?lech2=0-5&ln=hi";
  return "https://ncert.nic.in/textbook.php?ln=hi";
}

export default function AIChapterPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState("Physics");
  const [chapter, setChapter] = useState("Electric Charges and Fields");
  const [selectedMaterial, setSelectedMaterial] = useState<Category>("quiz");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace());

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSubject(p.get("subject") || "Physics");
    setChapter(p.get("chapter") || "Electric Charges and Fields");
    const material = p.get("material") as Category | null;
    if (material && materialInfo[material]) setSelectedMaterial(material);
  }, []);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const workspaceKey = useMemo(() => encodeURIComponent(`${subject}__${chapter}`), [subject, chapter]);
  const chapters = chapterLists[subject] || [];
  const index = Math.max(0, chapters.indexOf(chapter));
  const hindiNcertUrl = useMemo(() => ncertBookUrl(subject, chapter), [subject, chapter]);
  const current = materialInfo[selectedMaterial];
  const savedCount = Object.values(workspace).reduce((n, group) => n + Object.keys(group || {}).length, 0);

  useEffect(() => {
    if (!user) { setWorkspace(emptyWorkspace()); return; }
    return onValue(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}`), snap => {
      const raw = snap.exists() ? snap.val() : {};
      setWorkspace({ ...emptyWorkspace(), ...raw });
    }, () => setMessage("Saved material load नहीं हो सका। Firebase connection/rules check करें."));
  }, [user, workspaceKey]);

  function changeChapter(value: string) { if (value) window.location.href = `/study/ai-chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(value)}&material=${encodeURIComponent(selectedMaterial)}`; }

  async function askAI() {
    const prompt = question.trim(); if (!prompt || loading) return;
    setLoading(true); setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `You are teaching Class 12 ${subject}, chapter ${chapter}. The student is using ${current.title}. Answer accurately in Hindi-first Hinglish, keeping important scientific terms in English. Use headings, bullets and readable formulas. Do not reproduce copyrighted textbook passages.\n\nStudent request:\n${prompt}`, context: `Lakshya AI Chapter Workspace — ${subject} — ${chapter} — ${selectedMaterial}` }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "AI request failed");
      setAnswer(typeof data.text === "string" ? data.text : "कोई उत्तर नहीं मिला।");
    } catch (e) { setAnswer(e instanceof Error ? e.message : "AI अभी उपलब्ध नहीं है।"); }
    finally { setLoading(false); }
  }

  async function saveItem(category: Category, text: string) {
    if (!user) { setMessage("पहले Sign in करें ताकि आपका material permanently save हो सके।"); return; }
    if (!text.trim()) return;
    setSaving(true);
    const item: SavedItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: text.trim(), createdAt: Date.now(), category };
    try { await set(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}/${category}/${item.id}`), item); setMessage(`✓ ${materialInfo[category].title} इसी ${chapter} chapter के अंदर save हो गया।`); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Save नहीं हो सका।"); }
    finally { setSaving(false); }
  }

  async function generateMaterial(category: Category) {
    if (!user) { setMessage("पहले Sign in करें ताकि AI-generated material इसी chapter में save हो सके।"); return; }
    setGenerating(category); setMessage("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `${materialInfo[category].instruction}\n\nSubject: ${subject}\nChapter: ${chapter}\n\nImportant: Make original AI-generated study content. Do not reproduce NCERT text verbatim.`, context: `Lakshya AI generator — ${subject} — ${chapter} — ${category}` }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "AI generation failed");
      const text = typeof data.text === "string" ? data.text : ""; if (!text) throw new Error("AI ने कोई content नहीं दिया।");
      await saveItem(category, text); setSelectedMaterial(category);
    } catch (e) { setMessage(e instanceof Error ? e.message : "AI material generate नहीं हो सका।"); }
    finally { setGenerating(null); }
  }

  async function deleteItem(category: Category, id: string) { if (!user) return; try { await remove(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}/${category}/${id}`)); setMessage("✓ Saved item हटाया गया।"); } catch (e) { setMessage(e instanceof Error ? e.message : "Delete नहीं हो सका।"); } }
  function exportWorkspace() { const blob = new Blob([JSON.stringify({ app: "Lakshya", subject, chapter, exportedAt: new Date().toISOString(), workspace }, null, 2)], { type: "application/json;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${subject}-${chapter}-Lakshya-study-material.json`; a.click(); URL.revokeObjectURL(url); }

  return <main className="page">
    <header className="hero"><Link href={`/study/${subject.toLowerCase()}`} className="back">← Study / पढ़ाई</Link><div className="eyebrow">LAKSHYA • AI CHAPTER STUDY ROOM</div><h1>{chapter}</h1><p>{subject} · AI से पढ़ो → बनाओ → Save करो · {savedCount} saved items</p><div className="heroActions"><button onClick={() => document.getElementById("ai")?.scrollIntoView({ behavior: "smooth" })}>✦ Lakshya AI</button><a href={hindiNcertUrl} target="_blank" rel="noreferrer">📖 Hindi NCERT</a><a href={hindiNcertUrl} download={`NCERT-Hindi-${subject}-${chapter}.pdf`}>⬇ Download NCERT PDF</a><button onClick={exportWorkspace}>↗ Export Saved</button></div></header>
    <nav className="nav"><button disabled={index <= 0} onClick={() => index > 0 && changeChapter(chapters[index - 1])}>← Previous</button><select value={chapter} onChange={e => changeChapter(e.target.value)}>{chapters.map((c, i) => <option key={c} value={c}>{i + 1}. {c}</option>)}</select><button disabled={index >= chapters.length - 1} onClick={() => index < chapters.length - 1 && changeChapter(chapters[index + 1])}>Next →</button></nav>
    {message && <div className="notice">{message}</div>}
    {!user && <div className="signin">Sign in करें ताकि AI से बनाए हुए Quiz, Notes, Summary, Flashcards, Practice, PYQ और Tricky Questions Firebase में इसी chapter के अंदर हमेशा सुरक्षित रहें।</div>}

    <section className="tabs">{(Object.keys(materialInfo) as Category[]).map(key => <button key={key} className={selectedMaterial === key ? "active" : ""} onClick={() => setSelectedMaterial(key)}><span>{materialInfo[key].icon}</span><b>{materialInfo[key].title}</b><small>{Object.keys(workspace[key] || {}).length} saved</small></button>)}</section>

    <section className="card materialHero"><div><span className="badge">{current.icon} {current.title}</span><h2>{chapter} के लिए AI {current.title}</h2><p>{current.description}. AI content इसी chapter workspace में save होगा — दूसरे chapter में mix नहीं होगा।</p></div><button className="generate" disabled={generating !== null} onClick={() => void generateMaterial(selectedMaterial)}>{generating === selectedMaterial ? "AI बना रहा है…" : `✦ AI से ${current.title} बनाएं`}</button></section>

    <section className="card ai" id="ai"><div className="aiHead"><div><span className="badge">✦ LAKSHYA AI • CHAPTER MODE</span><h2>पूछो → समझो → उसी material में Save करो</h2><p>Flashcard पढ़ते समय सवाल पूछो, Quiz explain कराओ, Notes improve करो और answer को इसी chapter के material में save करो।</p></div><div className="orb">✦<small>AI</small></div></div><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder={`${chapter} के बारे में AI से पूछें… / इस ${current.title} को समझने में मदद चाहिए?`} /><div className="actions"><button className="ask" disabled={!question.trim() || loading} onClick={() => void askAI()}>{loading ? "AI सोच रहा है…" : "✦ Ask Lakshya AI"}</button><button disabled={!answer.trim() || saving} onClick={() => void saveItem(selectedMaterial, answer)}>＋ इसी {current.title} में Save</button><button disabled={!answer.trim() || saving} onClick={() => void saveItem("summary", answer)}>＋ Quick Revision</button><button disabled={!answer.trim() || saving} onClick={() => void saveItem("flashcards", answer)}>＋ Flashcard</button></div>{answer && <div className="answer"><b>AI Explanation / AI उत्तर</b><textarea value={answer} onChange={e => setAnswer(e.target.value)} /></div>}</section>

    <section className="card ncert"><div><span className="badge">🇮🇳 OFFICIAL NCERT • HINDI MEDIUM</span><h2>Hindi NCERT Chapter</h2><p>Physics और Biology में Download button अब सीधे official NCERT PDF पर जाता है, NCERT textbook listing page पर नहीं। Chemistry के लिए official Hindi NCERT listing अभी रखी गई है क्योंकि उसका direct PDF endpoint verify नहीं मिला।</p></div><div className="ncertActions"><a href={hindiNcertUrl} target="_blank" rel="noreferrer">📖 Hindi NCERT खोलें</a><a href={hindiNcertUrl} download={`NCERT-Hindi-${subject}-${chapter}.pdf`}>⬇ PDF / Download</a></div></section>

    <section className="card saved"><div className="sectionTitle"><div><span className="badge">MY CHAPTER VAULT</span><h2>Saved Study Material / सेव सामग्री</h2></div><span>{savedCount} items</span></div>{(Object.keys(materialInfo) as Category[]).map(category => { const items = Object.values(workspace[category] || {}) as SavedItem[]; if (!items.length) return null; return <article className="group" key={category}><h3>{materialInfo[category].icon} {materialInfo[category].title} <small>{items.length}</small></h3>{items.slice().sort((a,b) => b.createdAt-a.createdAt).map(item => <div className="item" key={item.id}><div><small>{new Date(item.createdAt).toLocaleString("en-IN")}</small><p>{item.text}</p></div><button onClick={() => void deleteItem(category,item.id)}>Delete</button></div>)}</article>; })}{!savedCount && <div className="empty">अभी इस chapter में कुछ save नहीं है। ऊपर <b>AI से बनाएं</b> दबाओ।</div>}</section>

    <style jsx>{`
      .page{min-height:100vh;padding:18px 16px 80px;max-width:1100px;margin:auto;color:#202236;background:linear-gradient(135deg,#f7f0ff,#eef8ff 48%,#fff3fb)}.hero{background:linear-gradient(135deg,#27205d,#7149c9,#b34fd0);color:#fff;border-radius:24px;padding:22px;box-shadow:0 20px 50px rgba(67,45,130,.18)}.back{color:#eee;text-decoration:none;font-size:11px;font-weight:800}.eyebrow{font-size:8px;letter-spacing:.16em;font-weight:900;opacity:.75;margin-top:22px}.hero h1{font-size:30px;margin:7px 0}.hero p{font-size:11px;opacity:.82;margin:0}.heroActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.heroActions a,.heroActions button{border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.12);color:#fff;border-radius:11px;padding:9px 11px;font-size:9px;font-weight:900;text-decoration:none;cursor:pointer}.nav{display:flex;gap:8px;margin:12px 0}.nav select,.nav button{flex:1;border:1px solid #dedcf0;background:#fff;border-radius:11px;padding:10px;font-size:10px;font-weight:800;color:#45455a}.notice,.signin{padding:11px 13px;border-radius:12px;margin:10px 0;background:#fff;border:1px solid #e4def8;font-size:10px;line-height:1.5}.signin{background:#fff8e9;border-color:#f3dfae}.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.tabs button{min-height:78px;border:1px solid #e2e0ef;background:#fff;border-radius:14px;padding:10px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:3px}.tabs button span{font-size:18px}.tabs button b{font-size:9px}.tabs button small{font-size:8px;color:#8c8fa1}.tabs button.active{border-color:#7259dc;background:linear-gradient(135deg,#eee9ff,#f8ecff)}.card{background:rgba(255,255,255,.94);border:1px solid #e2e0ef;border-radius:20px;padding:18px;margin:12px 0;box-shadow:0 10px 35px rgba(52,48,100,.05)}.materialHero,.ncert{display:flex;justify-content:space-between;gap:16px;align-items:center}.badge{display:inline-block;background:#eeeaff;color:#5c4dc2;border-radius:7px;padding:5px 8px;font-size:8px;font-weight:900}.card h2{font-size:19px;margin:8px 0 5px}.card p{font-size:10px;color:#777c8e;line-height:1.6;margin:0}.generate,.ask,.actions button,.ncertActions a{border:0;background:#6552dc;color:#fff;border-radius:11px;padding:11px 13px;font-size:9px;font-weight:900;cursor:pointer;text-decoration:none;white-space:nowrap}.generate:disabled,.ask:disabled{opacity:.5}.aiHead{display:flex;justify-content:space-between;gap:15px}.orb{width:62px;height:62px;border-radius:20px;background:linear-gradient(135deg,#7654ed,#e448c8);color:#fff;display:grid;place-items:center;font-size:27px;flex:none}.orb small{font-size:8px;margin-top:-19px}.ai>textarea,.answer textarea{width:100%;box-sizing:border-box;border:1px solid #ddd9ef;border-radius:13px;padding:12px;font:inherit;font-size:10px;line-height:1.6;min-height:95px;margin-top:13px;resize:vertical;outline:none;background:#fbfaff}.actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.actions button:not(.ask){background:#f0edff;color:#5146b5;border:1px solid #dcd5ff}.answer{margin-top:12px;background:#f8f6ff;border:1px solid #e2dcff;border-radius:13px;padding:12px}.answer>b{font-size:9px}.answer textarea{min-height:180px;background:#fff}.ncertActions{display:flex;gap:8px;flex-wrap:wrap}.ncertActions a{background:#202236}.sectionTitle{display:flex;justify-content:space-between;align-items:center}.sectionTitle>span{font-size:9px;color:#777c8e}.group{margin-top:12px;border:1px solid #e7e4f1;border-radius:14px;overflow:hidden;background:#fff}.group h3{margin:0;padding:11px 13px;background:#faf9ff;font-size:11px}.group h3 small{margin-left:5px;color:#8d90a0}.item{display:flex;justify-content:space-between;gap:10px;padding:12px 13px;border-top:1px solid #efedf4}.item small{font-size:7px;color:#a0a2ae}.item p{white-space:pre-wrap;font-size:10px;line-height:1.55;margin:5px 0 0}.item button{height:max-content;border:1px solid #ecd9e2;background:#fff4f7;color:#a24c68;border-radius:8px;padding:7px 9px;font-size:8px;font-weight:800}.empty{text-align:center;padding:30px 10px;color:#8b8e9d;font-size:10px}@media(max-width:700px){.page{padding:12px 10px 70px}.hero h1{font-size:24px}.tabs{grid-template-columns:repeat(2,1fr)}.materialHero,.ncert{flex-direction:column;align-items:stretch}.generate{width:100%}.ncertActions a{flex:1;text-align:center}.heroActions a,.heroActions button{flex:1;text-align:center}.aiHead{align-items:flex-start}.orb{width:52px;height:52px}.item{align-items:flex-start}}
    `}</style>
  </main>;
}
