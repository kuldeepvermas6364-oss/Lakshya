"use client";
import Link from "next/link";
import { useState } from "react";

const people = [
  { name: "Aarav", handle: "@aarav", mutual: "Physics group" },
  { name: "Ananya", handle: "@ananya", mutual: "Class 12 Boards" },
  { name: "Rohan", handle: "@rohan", mutual: "JEE 2027" },
];

export default function FriendsPage() {
  const [sent, setSent] = useState<string[]>([]);
  return <main className="simple-page"><header className="simple-head"><div><p className="eyebrow">YOUR NETWORK</p><h1>Friends</h1><p className="muted">Connect with classmates and study partners.</p></div><Link className="secondary" href="/community">Community</Link></header><section className="card-list"><div className="section-title"><h2>People you may know</h2><span>{people.length} suggestions</span></div>{people.map((p)=><article className="person-card" key={p.handle}><div className="avatar large">{p.name[0]}</div><div className="person-info"><strong>{p.name}</strong><small>{p.handle} · {p.mutual}</small></div><button className="primary" disabled={sent.includes(p.handle)} onClick={()=>setSent([...sent,p.handle])}>{sent.includes(p.handle)?"Request sent":"Add friend"}</button></article>)}</section><section className="safety-box"><strong>🛡️ Study-safe networking</strong><p>Keep conversations about learning. Never share passwords, OTPs, home addresses or other private information. Use Report or Block if someone behaves inappropriately.</p></section></main>;
}
