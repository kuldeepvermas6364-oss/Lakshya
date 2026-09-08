"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { sendFriendRequest } from "@/lib/social-graph";

const people = [
  { name: "Aarav", handle: "@aarav", uid: "aarav", mutual: "Physics group" },
  { name: "Ananya", handle: "@ananya", uid: "ananya", mutual: "Class 12 Boards" },
  { name: "Rohan", handle: "@rohan", uid: "rohan", mutual: "JEE 2027" },
];

export default function FriendsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null)), []);

  async function addFriend(uid: string) {
    if (!userId) { setError("Please sign in first."); return; }
    try { await sendFriendRequest(userId, uid); setSent((x) => [...x, uid]); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Request failed"); }
  }

  return <main className="simple-page"><header className="simple-head"><div><p className="eyebrow">YOUR NETWORK</p><h1>Friends</h1><p className="muted">Connect with classmates and study partners.</p></div><Link className="secondary" href="/community">Community</Link></header><section className="card-list"><div className="section-title"><h2>People you may know</h2><span>{people.length} suggestions</span></div>{people.map((p)=><article className="person-card" key={p.handle}><div className="avatar large">{p.name[0]}</div><div className="person-info"><strong>{p.name}</strong><small>{p.handle} · {p.mutual}</small></div><button className="primary" disabled={!userId||sent.includes(p.uid)} onClick={()=>addFriend(p.uid)}>{sent.includes(p.uid)?"Request sent":userId?"Add friend":"Sign in"}</button></article>)}</section>{error&&<p className="muted center">{error}</p>}<section className="safety-box"><strong>🛡️ Study-safe networking</strong><p>Keep conversations about learning. Never share passwords, OTPs, home addresses or other private information. Use Report or Block if someone behaves inappropriately.</p></section></main>;
}
