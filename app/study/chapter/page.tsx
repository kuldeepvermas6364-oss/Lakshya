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
const labels: Record<Category, string> = { mcq: "MCQ Bank", flashcards: "Flashcards", keyPoints: "Key Points", quickRevision: "Quick Revision" };

export default function ChapterWorkspacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState("Chemistry");
  const [chapter, setChapter] = useState("Solutions");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSubject(params.get("subject") || "Chemistry");
    setChapter(params.get("chapter") || "Solutions");
  }, []);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const workspaceKey = useMemo(() => encodeURIComponent(`${subject}__${chapter}`), [subject, chapter]);
  useEffect(() => {
    if (!user) { setWorkspace(emptyWorkspace()); return; }
    return onValue(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}`), snap => {
      const value = snap.exists() ? snap.val() : {};
      setWorkspace({ ...emptyWorkspace(), ...value });
    }, () => setMessage("Saved items could not be loaded. Check Firebase Realtime Database rules."));
  }, [user, workspaceKey]);

  async function askAI() {
    if (!question.trim() || loading) return;
    setLoading(true); setAnswer("");
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `You are teaching Class 12 ${subject}, chapter ${chapter}. Student question: ${question}. Explain accurately and simply. If useful, include one important fact, formula, definition or example. Do not use raw LaTeX delimiters; write formulas in readable plain text.`, context: `Lakshya chapter learning workspace for ${subject} — ${chapter}.` }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setAnswer(typeof data.text === "string" ? data.text : "No answer returned.");
    } catch (e) { setAnswer(e instanceof Error ? e.message : "AI is temporarily unavailable."); }
    finally { setLoading(false); }
  }

  async function saveItem(category: Category, text = answer) {
    if (!user) { setMessage("Sign in first to keep your saved study points."); return; }
    if (!text.trim()) return;
    setSaving(true);
    const item: SavedItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, text: text.trim(), createdAt: Date.now() };
    try {
      await set(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}/${category}/${item.id}`), item);
      setMessage(`✓ Saved to ${labels[category]}. It stays inside ${chapter} until you delete it.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not save this point."); }
    finally { setSaving(false); }
  }

  async function captureWithAI(category: Category) {
    if (!answer.trim()) return;
    if (!user) { setMessage("Sign in first to keep your captured study item."); return; }
    setCapturing(category);
    try {
      const instruction = category === "mcq"
        ? "Convert this explanation into ONE exam-quality MCQ. Include Question, four options A-D, and Correct Answer."
        : "Convert this explanation into ONE concise flashcard. Format exactly as Front: ... and Back: ...";
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `${instruction}\n\nChapter: ${subject} — ${chapter}\n\nSource explanation:\n${answer}\n\nKeep it accurate, student-friendly and free of raw LaTeX delimiters.`, context: `AI Capture System for chapter ${chapter}.` }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI capture failed");
      await saveItem(category, typeof data.text === "string" ? data.text : answer);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not create this capture."); }
    finally { setCapturing(null); }
  }

  async function deleteItem(category: Category, id: string) {
    if (!user) return;
    try {
      await remove(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}/${category}/${id}`));
      setMessage(`✓ Removed from ${labels[category]}.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not delete this item."); }
  }

  async function saveAll() {
    if (!user) { setMessage("Sign in first to save your chapter workspace."); return; }
    setSaving(true);
    try { await set(ref(realtimeDb, `users/${user.uid}/chapterWorkspace/${workspaceKey}`), workspace); setMessage("✓ Chapter workspace saved."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not save workspace."); }
    finally { setSaving(false); }
  }

  function exportWorkspace() {
    const payload = { app: "Lakshya", subject, chapter, exportedAt: new Date().toISOString(), workspace };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${subject}-${chapter}-Lakshya-captures.json`; a.click(); URL.revokeObjectURL(url);
    setMessage("✓ Export complete. Your online saved items are still kept.");
  }

  return <main className="workspace"><header><Link href="/study">← Study</Link><div><span>LAKSHYA • CHAPTER WORKSPACE</span><h1>{chapter}</h1><p>{subject} · AI-powered learning space</p></div><div className="topActions"><Link className="secondary" href={`/study/ncert?subject=${encodeURIComponent(subject)}`}>▣ NCERT Book</Link><button onClick={exportWorkspace}>↗ Export</button><button className="primary" disabled={saving} onClick={() => void saveAll()}>{saving ? "Saving…" : "Save Workspace"}</button></div></header>
    {message && <div className="notice">{message}</div>}
    {!user && <div className="signin">Sign in to keep your saved MCQs, flashcards, key points and revisions across devices.</div>}
    <section className="ai"><div><span className="badge">✦ AI STUDY MODE</span><h2>Padho → samjho → important point save karo</h2><p>AI se chapter ke concepts poochho. Answer ko directly MCQ, Flashcard, Key Point ya Quick Revision mein convert karke permanently chapter ke andar save karo.</p></div><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder={`Ask about ${chapter}…`} /><button className="primary ask" disabled={!question.trim() || loading} onClick={() => void askAI()}>{loading ? "Thinking…" : "Ask Lakshya AI →"}</button>{answer && <div className="answer"><div className="answerHead"><b>AI Explanation</b><span>Editable before saving</span></div><textarea value={answer} onChange={e => setAnswer(e.target.value)} /><div className="saveButtons"><button disabled={capturing !== null || saving} onClick={() => void captureWithAI("mcq")}>{capturing === "mcq" ? "Creating MCQ…" : "✦ AI → MCQ"}</button><button disabled={capturing !== null || saving} onClick={() => void captureWithAI("flashcards")}>{capturing === "flashcards" ? "Creating…" : "✦ AI → Flashcard"}</button><button onClick={() => void saveItem("keyPoints")} disabled={saving}>＋ Key Point</button><button onClick={() => void saveItem("quickRevision")} disabled={saving}>＋ Quick Revision</button></div></div>}</section>
    <section className="capture"><div><h2>Quick Capture</h2><p>AI ke bahar textbook/lecture se koi point mila? Yahin type karke chapter ke memory bank mein save kar do.</p></div><textarea id="quickNote" placeholder="Important point yahan likho…" /><div className="captureButtons">{(Object.keys(labels) as Category[]).map(k => <button key={k} onClick={() => { const el = document.getElementById("quickNote") as HTMLTextAreaElement | null; if (el?.value.trim()) { void saveItem(k, el.value); el.value = ""; } }}>{labels[k]}</button>)}</div></section>
    <section className="saved"><div className="savedHead"><div><span className="badge">YOUR CHAPTER MEMORY</span><h2>Saved inside this chapter</h2></div><small>Cloud saved · {user ? "Synced" : "Sign in required"}</small></div><div className="grid">{(Object.keys(labels) as Category[]).map(k => <article key={k}><h3>{labels[k]} <small>{Object.keys(workspace[k]).length}</small></h3>{Object.values(workspace[k]).length ? Object.values(workspace[k]).sort((a,b)=>b.createdAt-a.createdAt).map(item => <div className="item" key={item.id}><div>{item.text}</div>{user && <button className="delete" title="Delete this saved item" onClick={() => void deleteItem(k, item.id)}>Delete</button>}</div>) : <div className="empty">Nothing saved yet.</div>}</article>)}</div></section>
    <style jsx>{`body{background:#f6f7fb}.workspace{max-width:1080px;margin:auto;padding:28px 22px 70px;color:#171a2b}.workspace header{display:flex;gap:18px;align-items:flex-end;margin-bottom:18px}.workspace header>a:first-child{align-self:flex-start;color:#697183;text-decoration:none;font-size:11px;font-weight:800}.workspace header>div:nth-child(2){flex:1}.workspace header span{font-size:8px;letter-spacing:.15em;color:#9299a8;font-weight:900}.workspace h1{margin:4px 0;font-size:30px;letter-spacing:-1px}.workspace header p,.ai p,.capture p{margin:0;color:#858c9c;font-size:10px;line-height:1.6}.topActions{display:flex;gap:7px;align-items:center}.topActions button,.topActions .secondary,.saveButtons button,.captureButtons button{border:1px solid #dddff0;background:#fff;border-radius:9px;padding:9px 11px;font-size:9px;font-weight:800;color:#5f6676;text-decoration:none}.primary{background:#1b1d2b!important;color:#fff!important;border-color:#1b1d2b!important}.notice,.signin{background:#1b1d2b;color:#fff;padding:10px 13px;border-radius:10px;font-size:9px;margin-bottom:12px}.ai,.capture,.saved{background:#fff;border:1px solid #e4e6ef;border-radius:16px;padding:18px;margin-bottom:14px}.badge{display:inline-block;background:#f0efff;color:#6258df;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:900;letter-spacing:.1em}.ai h2,.capture h2,.saved h2{font-size:20px;margin:9px 0 6px;letter-spacing:-.5px}.ai>textarea,.answer textarea,.capture>textarea{width:100%;box-sizing:border-box;min-height:90px;margin-top:13px;border:1px solid #e0e3ec;border-radius:10px;padding:11px;font:inherit;font-size:10px;line-height:1.6;resize:vertical;outline:none}.ask{margin-top:9px;border:0;border-radius:9px;padding:10px 14px;font-size:9px;font-weight:800}.answer{border-top:1px solid #eceef3;margin-top:16px;padding-top:14px}.answerHead{display:flex;justify-content:space-between}.answerHead b{font-size:10px}.answerHead span{font-size:8px;color:#9097a6}.answer textarea{min-height:150px}.saveButtons,.captureButtons{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.saveButtons button{border-color:#d7d3ff;color:#5d55c9}.saveButtons button:disabled{opacity:.55;cursor:not-allowed}.savedHead{display:flex;justify-content:space-between;align-items:end;margin-bottom:12px}.savedHead h2{margin-bottom:0}.savedHead small{font-size:8px;color:#9198a6}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.grid article{border:1px solid #e8eaf0;border-radius:11px;padding:11px;min-height:120px;background:#fbfbfd}.grid h3{font-size:10px;margin:0 0 9px}.grid h3 small{font-size:8px;color:#635bff;margin-left:4px}.item{font-size:9px;line-height:1.5;padding:8px;border-radius:8px;background:#fff;border:1px solid #eef0f4;margin-bottom:6px;white-space:pre-wrap}.delete{margin-top:7px;border:0;background:transparent;color:#a36a72;font-size:8px;font-weight:800;padding:0;cursor:pointer}.empty{font-size:9px;color:#9aa0ad}.capture{background:linear-gradient(135deg,#fff,#faf9ff)}@media(max-width:700px){.workspace{padding:20px 14px 80px}.workspace header{align-items:flex-start;flex-wrap:wrap}.workspace header>div:nth-child(2){min-width:65%}.workspace h1{font-size:25px}.topActions{width:100%;flex-wrap:wrap}.topActions button,.topActions .secondary{flex:1}.grid{grid-template-columns:1fr 1fr}.grid article{min-height:100px}}`}</style>
  </main>;
}
