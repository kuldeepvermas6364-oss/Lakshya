"use client";

import Link from "next/link";

export default function BookmarksPage() {
  return <main className="page"><div className="hero-row"><div><p className="eyebrow">SAVED FOR LATER</p><h1>Bookmarks</h1><p className="muted">Keep important chapters, questions and learning resources one tap away.</p></div><Link className="secondary" href="/study">Browse Study →</Link></div><section className="panel" style={{maxWidth:900,margin:"10px auto",padding:48,textAlign:"center"}}><div style={{fontSize:32}}>🔖</div><h2 style={{margin:"12px 0 6px"}}>Your saved learning items will appear here</h2><p className="muted">This workspace is intentionally empty until you save something. Lakshya never invents bookmarked content.</p><Link className="primary" href="/study" style={{display:"inline-block",marginTop:16}}>Explore chapters →</Link></section></main>;
}
