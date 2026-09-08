"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureConversation } from "@/lib/conversations";
import { sendRealtimeMessage, subscribeToRealtimeMessages, type RealtimeMessage } from "@/lib/rtdb-chat";

const chats = [
  { name: "Aarav", uid: "aarav", preview: "Can you explain this Physics question?", time: "8:42 PM" },
  { name: "Ananya", uid: "ananya", preview: "I shared the revision plan.", time: "7:15 PM" },
  { name: "Rohan", uid: "rohan", preview: "JEE practice at 9?", time: "Yesterday" },
];

export default function MessagesPage() {
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [error, setError] = useState("");
  const chat = chats[selected];

  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  useEffect(() => {
    let unsubscribe = () => {};
    setMessages([]);
    setError("");
    if (!userId) return () => unsubscribe();
    ensureConversation(userId, chat.uid)
      .then((id) => {
        setConversationId(id);
        unsubscribe = subscribeToRealtimeMessages(id, setMessages);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not open chat"));
    return () => unsubscribe();
  }, [userId, chat.uid]);

  const displayMessages = useMemo(() => messages.filter((m) => m.text), [messages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !conversationId || !draft.trim()) return;
    try {
      await sendRealtimeMessage(conversationId, userId, draft);
      setDraft("");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Message could not be sent");
    }
  }

  return <main className="messages-page"><header className="simple-head"><div><p className="eyebrow">PRIVATE STUDY CHAT</p><h1>Messages</h1></div><Link className="secondary" href="/friends">Friends</Link></header><div className="chat-layout"><aside className="chat-list">{chats.map((c,i)=><button className={selected===i?"chat-row selected":"chat-row"} onClick={()=>setSelected(i)} key={c.uid}><span className="avatar">{c.name[0]}</span><span><b>{c.name}</b><small>{c.preview}</small></span><time>{c.time}</time></button>)}</aside><section className="chat-window"><div className="chat-head"><span className="avatar">{chat.name[0]}</span><div><b>{chat.name}</b><small>Study partner · realtime</small></div></div><div className="chat-body">{displayMessages.length===0&&<div className="bubble other">Start a focused study conversation.</div>}{displayMessages.map((m)=><div className={m.senderId===userId?"bubble mine":"bubble other"} key={m.id}>{m.text}</div>)}</div><form className="composer" onSubmit={submit}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={userId?"Message your study partner...":"Sign in to message..."} maxLength={4000} disabled={!userId||!conversationId}/><button className="primary" disabled={!userId||!conversationId||!draft.trim()}>Send</button></form></section></div>{error&&<p className="muted center">{error}</p>}<p className="muted center">Realtime messaging is connected through Firebase. Keep personal contact details private.</p></main>;
}
