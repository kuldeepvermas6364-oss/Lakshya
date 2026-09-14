"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { onValue, ref, remove, set } from "firebase/database";
import { auth, realtimeDb } from "../../../lib/firebase";

type Category = "mcq" | "flashcards" | "keyPoints" | "quickRevision";
type SavedItem = { id: string; text: string; createdAt: number };
type Workspace = Record<Category, Record<string, SavedItem>>;
const emptyWorkspace = (): Workspace => ({ mcq: {}, flashcards: {}, keyPoints: {}, quickRevision: {} });
const labels: Record<Category, string> = { mcq: "MCQ Bank / MCQ बैंक", flashcards: "Flashcards / फ्लैशकार्ड", keyPoints: "Key Points / मुख्य बिंदु", quickRevision: "Quick Revision / त्वरित रिवीजन" };

const chapterLists: Record<string, string[]> = {
  Physics: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Magnetism and Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics and Optical Instruments", "Wave Optics", "Dual Nature of Radiation and Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
  Chemistry: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers", "Aldehydes, Ketones and Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"],
  Biology: ["Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health and Disease", "Biotechnology: Principles and Processes", "Biotechnology and its Applications", "Ecology and Environment"],
};

function ncertPdfUrl(subject: string, chapter: string) {
  const index = Math.max(0, (chapterLists[subject] || []).indexOf(chapter));
  if (subject === "Physics") return index < 8 ? "https://ncert.nic.in/textbook/pdf/leph1ps.pdf" : "https://ncert.nic.in/textbook/pdf/leph2ps.pdf";
  if (subject === "Chemistry") return index < 5 ? "https://ncert.nic.in/textbook/pdf/lech1ps.pdf" : "https://ncert.nic.in/textbook/pdf/lech2ps.pdf";
  if (subject === "Biology") return "https://ncert.nic.in/textbook/pdf/lebo1ps.pdf";
  return "https://ncert.nic.in/textbook.php";
}

export default function ChapterWorkspacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState("Chemistry");
  const [chapter, setChapter] = useState("Solutions");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace());
  const [showNcert, setShowNcert] = useState(true);
  const [ncertPage, setNcertPage] = useState(1);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSubject(p.get("subject") || "Chemistry");
    setChapter(p.get("chapter") || "Solutions");
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const workspaceKey = useMemo(() => encodeURIComponent(`${subject}__${chapter}`), [subject, chapter]);
  const chapters = chapterLists[subject] || [];
  const chapterIndex = Math.max(0, chapters.indexOf(chapter));
  const prevChapter = chapters[chapterIndex - 1];
  const nextChapter = chapters[chapterIndex + 1];
  const pdfUrl = useMemo(() => ncertPdfUrl(subject, chapter), [subject, chapter]);

  useEffect(() => {
    setNcertPage(1);
    setSelectedText("");
  }, [subject, chapter]);

  useEffect(() => {
    if (!user) {
      setWorkspace(emptyWorkspace());
      return;
    }
    return onValue(
      ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}`),
      snap => setWorkspace({ ...emptyWorkspace(), ...(snap.exists() ? snap.val() : {}) }),
      () => setMessage("Saved items load नहीं हो सके / Could not load saved items. Check Firebase rules.")
    );
  }, [user, workspaceKey]);

  async function askAI(custom?: string) {
    const prompt = (custom ?? question).trim();
    if (!prompt || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are teaching Class 12 ${subject}, chapter ${chapter}. ${custom ? "The student selected this NCERT text and wants it explained:" : "Student question:"}\n\n${prompt}\n\nExplain accurately and simply in a natural mix of Hindi and English when useful. Keep important terms in English with Hindi explanation. Stay faithful to the supplied text, clarify difficult terms, and add a short example only when useful. If useful, include one important fact, formula, definition or example. Do not reproduce additional NCERT textbook passages. Do not use raw LaTeX delimiters; write formulas in readable plain text.`,
          context: `Lakshya chapter learning workspace for ${subject} — ${chapter}. Selected NCERT text is user-provided for explanation only.`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setAnswer(typeof data.text === "string" ? data.text : "No answer returned / कोई उत्तर नहीं मिला।");
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : "AI temporarily unavailable / AI अभी उपलब्ध नहीं है।");
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(category: Category, text = answer) {
    if (!user) {
      setMessage("पहले Sign in करें / Please sign in to save your study material.");
      return;
    }
    if (!text.trim()) return;
    setSaving(true);
    const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: text.trim(), createdAt: Date.now() };
    try {
      await set(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}/${category}/${item.id}`), item);
      setMessage(`✓ Saved / सेव हुआ: ${labels[category]} — ${chapter} के अंदर सुरक्षित रहेगा।`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save / सेव नहीं हो सका।");
    } finally {
      setSaving(false);
    }
  }

  async function captureWithAI(category: Category) {
    if (!answer.trim()) return;
    if (!user) {
      setMessage("पहले Sign in करें / Please sign in to keep your captured study item.");
      return;
    }
    setCapturing(category);
    try {
      const instruction = category === "mcq"
        ? "Convert this explanation into ONE exam-quality MCQ. Include Question, four options A-D, and Correct Answer."
        : "Convert this explanation into ONE concise flashcard. Format exactly as Front: ... and Back: ...";
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${instruction}\n\nChapter: ${subject} — ${chapter}\n\nSource explanation:\n${answer}\n\nKeep it accurate, student-friendly, bilingual where natural, and free of raw LaTeX delimiters.`,
          context: `AI Capture System for chapter ${chapter}.`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI capture failed");
      await saveItem(category, typeof data.text === "string" ? data.text : answer);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not create this capture / capture नहीं बन सका।");
    } finally {
      setCapturing(null);
    }
  }

  async function deleteItem(category: Category, id: string) {
    if (!user) return;
    try {
      await remove(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}/${category}/${id}`));
      setMessage(`✓ Removed / हटाया गया: ${labels[category]}.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not delete / हटाया नहीं जा सका।");
    }
  }

  function exportWorkspace() {
    const payload = { app: "Lakshya", subject, chapter, exportedAt: new Date().toISOString(), workspace };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subject}-${chapter}-Lakshya-captures.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("✓ Export complete / Export पूरा हुआ।");
  }

  function changeChapter(value: string) {
    if (value) window.location.href = `/study/chapter?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(value)}`;
  }

  return (
    <main className="workspace">
      <header>
        <Link href="/study">← Study / पढ़ाई</Link>
        <div>
          <span>LAKSHYA • CHAPTER WORKSPACE / अध्याय वर्कस्पेस</span>
          <h1>{chapter}</h1>
          <p>{subject} · AI-powered learning space / AI से सीखने की जगह</p>
        </div>
        <div className="topActions">
          <button className={showNcert ? "primary" : "secondary"} onClick={() => setShowNcert(v => !v)}>▣ {showNcert ? "Hide NCERT / NCERT छुपाएँ" : "Open NCERT / NCERT खोलें"}</button>
          <Link className="secondary" href={`/study/ncert?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`}>NCERT Library / लाइब्रेरी</Link>
          <button onClick={exportWorkspace}>↗ Export / एक्सपोर्ट</button>
        </div>
      </header>

      <nav className="chapterNav">
        <button disabled={!prevChapter} onClick={() => prevChapter && changeChapter(prevChapter)}>← Previous / पिछला</button>
        <select value={chapter} onChange={e => changeChapter(e.target.value)}>{chapters.map((c, i) => <option key={c} value={c}>{i + 1}. {c}</option>)}</select>
        <button disabled={!nextChapter} onClick={() => nextChapter && changeChapter(nextChapter)}>Next / अगला →</button>
      </nav>

      {message && <div className="notice">{message}</div>}
      {!user && <div className="signin">Sign in करें ताकि आपका saved chapter material devices पर बना रहे / Sign in to keep your saved chapter material across devices.</div>}

      <section className="ai aiHero">
        <div className="aiHeroTop">
          <div>
            <span className="badge">✦ LAKSHYA AI • AI STUDY MODE</span>
            <h2>पूछो → समझो → Save करो / Ask → Understand → Save</h2>
            <p>Chapter के concepts AI से पूछें। फिर answer को MCQ, Flashcard, Key Point या Quick Revision में permanently save करें.</p>
          </div>
          <div className="aiOrb">✦<small>AI</small></div>
        </div>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder={`Ask Lakshya AI about ${chapter}… / ${chapter} के बारे में AI से पूछें…`} />
        <button className="primary ask" disabled={!question.trim() || loading} onClick={() => void askAI()}>{loading ? "Thinking… / सोच रहा हूँ…" : "✦ Ask Lakshya AI / Lakshya AI से पूछें →"}</button>
        {answer && <div className="answer">
          <div className="answerHead"><b>AI Explanation / AI की व्याख्या</b><span>Editable before saving / Save करने से पहले edit करें</span></div>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} />
          <div className="saveButtons">
            <button disabled={capturing !== null || saving} onClick={() => void captureWithAI("mcq")}>{capturing === "mcq" ? "Creating MCQ…" : "✦ AI → MCQ / MCQ बनाएं"}</button>
            <button disabled={capturing !== null || saving} onClick={() => void captureWithAI("flashcards")}>{capturing === "flashcards" ? "Creating…" : "✦ AI → Flashcard / फ्लैशकार्ड"}</button>
            <button disabled={saving} onClick={() => void saveItem("keyPoints")}>＋ Key Point / मुख्य बिंदु</button>
            <button disabled={saving} onClick={() => void saveItem("quickRevision")}>＋ Quick Revision / त्वरित रिवीजन</button>
          </div>
        </div>}
      </section>

      {showNcert && <section className="ncertReader">
        <div className="readerHead">
          <div>
            <span className="badge">OFFICIAL NCERT • PDF VIEWER / आधिकारिक NCERT</span>
            <h2>{chapter}</h2>
            <p>Official NCERT PDF पढ़ें। अगर browser embedded PDF को block करे, तो ऊपर <b>Open PDF / PDF खोलें</b> दबाकर पूरा PDF नए tab में खोलें.</p>
          </div>
          <div className="readerActions">
            <a href={pdfUrl} target="_blank" rel="noreferrer">Open PDF ↗ / PDF खोलें</a>
            <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noreferrer">NCERT Portal ↗ / पोर्टल</a>
          </div>
        </div>
        <div className="readerToolbar">
          <button onClick={() => setNcertPage(p => Math.max(1, p - 1))}>‹</button>
          <span>Page / पेज {ncertPage}</span>
          <button onClick={() => setNcertPage(p => p + 1)}>›</button>
          <span className="readerHint">PDF viewer · Browser controls / ब्राउज़र controls</span>
        </div>
        <div className="pdfFrame"><iframe title={`NCERT ${chapter}`} src={`${pdfUrl}#page=${ncertPage}&zoom=page-width`} /></div>
        <div className="selectionBox">
          <div><b>Explain selected NCERT text with AI / चुना हुआ NCERT text AI से समझें</b><span>Official NCERT PDF browser security की वजह से directly read नहीं किया जा सकता। Text select/copy करके नीचे paste करें, फिर Lakshya AI उसे समझाएगा.</span></div>
          <textarea value={selectedText} onChange={e => setSelectedText(e.target.value)} placeholder="Paste selected NCERT text here… / चुना हुआ text यहाँ paste करें…" />
          <div className="selectionActions">
            <button className="primary" disabled={!selectedText.trim() || loading} onClick={() => void askAI(selectedText)}>✦ Explain with Lakshya AI / AI से समझें</button>
            <button disabled={!selectedText.trim()} onClick={() => setQuestion(selectedText)}>Use as question / Question बनाएं</button>
            <button disabled={!selectedText.trim()} onClick={() => setSelectedText("")}>Clear / साफ करें</button>
          </div>
        </div>
      </section>}

      <section className="saved">
        <div className="savedHead"><div><span className="badge">YOUR CHAPTER MEMORY / CHAPTER MEMORY</span><h2>Saved inside this chapter / इस chapter में सेव</h2></div><small>Cloud saved / Cloud में सेव · {user ? "Synced / Sync" : "Sign in required / Sign in जरूरी"}</small></div>
        <div className="grid">{(Object.keys(labels) as Category[]).map(k => <article key={k}><h3>{labels[k]} <small>{Object.keys(workspace[k]).length}</small></h3>{Object.values(workspace[k]).length ? Object.values(workspace[k]).sort((a, b) => b.createdAt - a.createdAt).map(item => <div className="item" key={item.id}><div>{item.text}</div>{user && <button className="delete" onClick={() => void deleteItem(k, item.id)}>Delete / हटाएँ</button>}</div>) : <div className="empty">Nothing saved yet / अभी कुछ सेव नहीं है.</div>}</article>)}</div>
      </section>

      <style jsx>{`body{background:#f6f7fb}.workspace{max-width:1080px;margin:auto;padding:28px 22px 70px;color:#171a2b}.workspace header{display:flex;gap:18px;align-items:flex-end;margin-bottom:12px}.workspace header>a:first-child{align-self:flex-start;color:#697183;text-decoration:none;font-size:11px;font-weight:800}.workspace header>div:nth-child(2){flex:1}.workspace header span{font-size:8px;letter-spacing:.08em;color:#9299a8;font-weight:900}.workspace h1{margin:4px 0;font-size:30px}.workspace header p,.ai p,.readerHead p{margin:0;color:#858c9c;font-size:10px;line-height:1.6}.topActions{display:flex;gap:7px;flex-wrap:wrap}.topActions button,.secondary,.saveButtons button,.selectionActions button,.chapterNav button,.chapterNav select{border:1px solid #dddff0;background:#fff;border-radius:9px;padding:9px 11px;font-size:9px;font-weight:800;color:#5f6676;text-decoration:none}.primary{background:#1b1d2b!important;color:#fff!important;border-color:#1b1d2b!important}.notice,.signin{background:#1b1d2b;color:#fff;padding:10px 13px;border-radius:10px;font-size:9px;margin-bottom:12px}.chapterNav{display:flex;gap:7px;align-items:center;margin-bottom:14px}.chapterNav select{flex:1;min-width:0}.chapterNav button:disabled{opacity:.45}.ncertReader,.ai,.saved{background:#fff;border:1px solid #e4e6ef;border-radius:16px;padding:18px;margin-bottom:14px}.aiHero{border-color:#dcd8ff;box-shadow:0 10px 30px rgba(74,63,180,.08);position:relative}.aiHeroTop{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.aiOrb{width:48px;height:48px;border-radius:15px;background:#6d5ce7;color:#fff;display:flex;align-items:center;justify-content:center;font-size:25px;box-shadow:0 8px 20px rgba(109,92,231,.28);flex:0 0 auto}.aiOrb small{font-size:7px;margin-top:24px;margin-left:-10px}.readerHead{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.badge{display:inline-block;background:#f0efff;color:#6258df;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:900;letter-spacing:.05em}.readerHead h2,.ai h2,.saved h2{font-size:20px;margin:9px 0 6px}.readerActions{display:flex;gap:7px;flex-wrap:wrap}.readerActions a{border:1px solid #dddff0;border-radius:9px;padding:9px 11px;font-size:9px;font-weight:800;color:#5d55c9;text-decoration:none;white-space:nowrap}.readerToolbar{display:flex;align-items:center;gap:8px;border-top:1px solid #eceef3;margin-top:14px;padding:10px 0;font-size:9px;font-weight:800}.readerToolbar button{border:1px solid #dddff0;background:#fff;border-radius:7px;padding:5px 10px;font-size:14px}.readerHint{margin-left:auto;color:#9299a8;font-size:8px;font-weight:500}.pdfFrame{height:620px;background:#eef0f5;border:1px solid #e0e3ea;border-radius:11px;overflow:hidden}.pdfFrame iframe{width:100%;height:100%;border:0;background:#fff}.selectionBox{margin-top:12px;border:1px solid #dedbff;background:#faf9ff;border-radius:12px;padding:13px}.selectionBox>div:first-child{display:flex;flex-direction:column;gap:4px}.selectionBox b{font-size:10px}.selectionBox span{font-size:8px;line-height:1.5;color:#7f8797}.selectionBox textarea{width:100%;box-sizing:border-box;min-height:75px;margin-top:10px;border:1px solid #dfdef0;border-radius:9px;padding:10px;font:inherit;font-size:9px;resize:vertical}.selectionActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}.ai>textarea,.answer textarea{width:100%;box-sizing:border-box;min-height:90px;margin-top:13px;border:1px solid #e0e3ec;border-radius:10px;padding:11px;font:inherit;font-size:10px;line-height:1.6;resize:vertical;outline:none}.ask{margin-top:9px;border:0;border-radius:9px;padding:11px 15px;font-size:9px;font-weight:900}.answer{border-top:1px solid #eceef3;margin-top:16px;padding-top:14px}.answerHead{display:flex;justify-content:space-between;gap:10px}.answerHead b{font-size:10px}.answerHead span{font-size:8px;color:#9097a6}.answer textarea{min-height:150px}.saveButtons{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.saveButtons button{border-color:#d7d3ff;color:#5d55c9}.saveButtons button:disabled,.selectionActions button:disabled{opacity:.55}.savedHead{display:flex;justify-content:space-between;align-items:end;margin-bottom:12px}.savedHead h2{margin-bottom:0}.savedHead small{font-size:8px;color:#9198a6}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.grid article{border:1px solid #e8eaf0;border-radius:11px;padding:11px;min-height:120px;background:#fbfbfd}.grid h3{font-size:10px;margin:0 0 9px}.grid h3 small{font-size:8px;color:#635bff;margin-left:4px}.item{font-size:9px;line-height:1.5;padding:8px;border-radius:8px;background:#fff;border:1px solid #eef0f4;margin-bottom:6px;white-space:pre-wrap}.delete{margin-top:7px;border:0;background:transparent;color:#a36a72;font-size:8px;font-weight:800;padding:0;cursor:pointer}.empty{font-size:9px;color:#9aa0ad}@media(max-width:700px){.workspace{padding:20px 14px 80px}.workspace header{align-items:flex-start;flex-wrap:wrap}.workspace header>div:nth-child(2){min-width:60%}.topActions{width:100%}.topActions button,.secondary{flex:1}.readerHead{display:block}.readerActions{margin-top:12px}.pdfFrame{height:520px}.readerHint{display:none}.grid{grid-template-columns:1fr 1fr}.chapterNav select{max-width:55%}.aiHeroTop{align-items:center}.aiHero .ask{width:100%;padding:13px}.saveButtons button,.selectionActions button{flex:1;min-width:135px}.answerHead{align-items:flex-start;flex-direction:column;gap:4px}.workspace h1{font-size:24px}}`}</style>
    </main>
  );
}
