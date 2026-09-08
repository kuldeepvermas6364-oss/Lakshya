"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { createCommunity, joinCommunity, listCommunities, type CommunityRecord } from "../../lib/community-storage";

const posts = [
  { name: "Aarav", initials: "A", time: "12 min ago", tag: "JEE Physics", text: "Can someone explain why electric field is zero inside a conductor in electrostatic equilibrium?", replies: 8, likes: 21 },
  { name: "Ananya", initials: "A", time: "34 min ago", tag: "Chemistry", text: "I made a quick revision sheet for Solutions. What topics should I add before my next mock?", replies: 12, likes: 34 },
  { name: "Rohan", initials: "R", time: "1 hr ago", tag: "Mathematics", text: "How are you all managing daily revision with coaching? Looking for a realistic routine.", replies: 17, likes: 29 },
];

export default function CommunityPage() {
  const [composer, setComposer] = useState("");
  const [postsState, setPostsState] = useState(posts);
  const [userId, setUserId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [newSpace, setNewSpace] = useState("");
  const [joined, setJoined] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUserId(user?.uid ?? null));
    listCommunities().then(setCommunities).catch(() => undefined);
    return unsubscribe;
  }, []);

  function publish() {
    const text = composer.trim();
    if (!text) return;
    setPostsState([{ name: "You", initials: "Y", time: "Just now", tag: "Discussion", text, replies: 0, likes: 0 }, ...postsState]);
    setComposer("");
  }

  async function createSpace() {
    if (!userId || !newSpace.trim()) { setError("Sign in and enter a study-space name."); return; }
    try {
      const id = await createCommunity(userId, { name: newSpace.trim(), slug: newSpace.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), category: "Study", type: "public", tagline: "A Lakshya study space" });
      setCommunities((x) => [{ id, name: newSpace.trim(), slug: id, ownerId: userId, memberCount: 1, category: "Study", type: "public" }, ...x]);
      setNewSpace(""); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create study space"); }
  }

  async function join(id: string) {
    if (!userId) { setError("Please sign in to join a study space."); return; }
    try { await joinCommunity(id, userId); setJoined((x) => [...x, id]); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not join space"); }
  }

  return <main className="community-page">
    <header className="community-header"><a href="/" className="back">← Dashboard</a><div><p>LAKSHYA COMMUNITY</p><h1>Learn together.</h1><span>Ask doubts, share notes, discuss preparation and find study partners.</span></div><button className="community-btn" onClick={() => document.getElementById("post-box")?.focus()}>+ New post</button></header>
    <div className="community-layout">
      <section>
        <div className="composer"><div className="avatar-small">K</div><textarea id="post-box" value={composer} onChange={e => setComposer(e.target.value)} placeholder="Ask a question or start a discussion..."/><div className="composer-bottom"><div><span># JEE</span><span># Boards</span><span># Doubts</span></div><button onClick={publish}>Post</button></div></div>
        <div className="feed-tabs"><b>For you</b><span>Latest</span><span>My discussions</span></div>
        {postsState.map((post, i) => <article className="post" key={i}><div className="post-head"><div className="avatar-small">{post.initials}</div><div><b>{post.name}</b><small>{post.time} · Public</small></div><button>•••</button></div><span className="post-tag">{post.tag}</span><p>{post.text}</p><div className="post-actions"><button>♡ {post.likes}</button><button>◌ {post.replies} replies</button><button>↗ Share</button></div></article>)}
      </section>
      <aside className="community-side"><div className="side-card"><p>DISCOVER</p><h2>Study spaces</h2>{communities.length ? communities.slice(0, 6).map((c) => <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,borderTop:"1px solid #eef0f2",padding:"9px 0"}}><a href="#" style={{border:0,padding:0}}>{c.name}</a><button onClick={() => join(c.id)} disabled={joined.includes(c.id)} style={{border:0,background:"none",fontSize:10,fontWeight:800}}>{joined.includes(c.id) ? "Joined" : "Join"}</button></div>) : <><a href="#">JEE 2027 →</a><a href="#">Class 12 Boards →</a><a href="#">Physics Doubts →</a><a href="#">Chemistry Help →</a></>}
          <div style={{display:"flex",gap:6,marginTop:12}}><input value={newSpace} onChange={e => setNewSpace(e.target.value)} placeholder="Create study space" style={{minWidth:0,flex:1,padding:8,border:"1px solid #e2e5e8",borderRadius:7,fontSize:10}}/><button onClick={createSpace} style={{border:0,borderRadius:7,padding:"8px 9px",fontWeight:800}}>Create</button></div>
        </div><div className="side-card"><p>SAFETY</p><h2>Keep it respectful.</h2><small>Community spaces are for learning. Report spam, harassment or unsafe content. Never share passwords, phone numbers, addresses or other private information.</small></div></aside>
    </div>{error && <p className="muted center">{error}</p>}
    <style jsx global>{`body{background:#f6f7f9}.community-page{max-width:1120px;margin:auto;padding:34px 24px 70px;color:#17202a}.community-header{display:flex;align-items:flex-end;gap:25px;margin-bottom:25px}.community-header>div{flex:1}.back{display:block;align-self:flex-start;color:#69747f;font-size:12px;font-weight:700;margin-top:6px}.community-header p{font-size:9px;letter-spacing:.16em;font-weight:900;color:#89939e;margin:0 0 7px}.community-header h1{font-size:31px;margin:0;letter-spacing:-.04em}.community-header span{display:block;color:#7d8791;font-size:12px;margin-top:7px}.community-btn,.composer-bottom button{background:#18212b;color:#fff;border:0;border-radius:9px;padding:11px 15px;font-size:11px;font-weight:800}.community-layout{display:grid;grid-template-columns:1fr 285px;gap:18px}.composer,.post,.side-card{background:#fff;border:1px solid #e7eaed;border-radius:14px;box-shadow:0 5px 20px #17202a08}.composer{padding:16px;margin-bottom:12px;display:grid;grid-template-columns:38px 1fr;gap:10px}.avatar-small{width:38px;height:38px;border-radius:11px;background:#e9edf0;display:grid;place-items:center;font-weight:900;font-size:12px}.composer textarea{border:0;outline:0;resize:vertical;min-height:55px;font:inherit;font-size:13px;padding:5px 0}.composer-bottom{grid-column:2;display:flex;justify-content:space-between;align-items:center}.composer-bottom span{font-size:9px;font-weight:700;color:#78838e;margin-right:8px}.feed-tabs{height:48px;display:flex;align-items:center;gap:22px;border-bottom:1px solid #e5e8eb;font-size:11px;color:#8b949e}.feed-tabs b{height:100%;display:flex;align-items:center;border-bottom:2px solid #18212b;color:#18212b}.post{padding:17px;margin-top:12px}.post-head{display:flex;align-items:center;gap:10px}.post-head>div:nth-child(2){flex:1}.post-head b,.post-head small{display:block}.post-head b{font-size:12px}.post-head small{font-size:9px;color:#929ba4;margin-top:2px}.post-head>button{border:0;background:none;color:#929ba4}.post-tag{display:inline-block;background:#f0f2f4;color:#6e7984;padding:5px 8px;border-radius:6px;font-size:8px;font-weight:800;margin:13px 0 4px}.post p{font-size:13px;line-height:1.6;margin:6px 0 15px}.post-actions{border-top:1px solid #eef0f2;padding-top:11px;display:flex;gap:20px}.post-actions button{border:0;background:none;color:#7d8791;font-size:10px;font-weight:700}.side-card{padding:17px;margin-bottom:12px}.side-card p{font-size:9px;letter-spacing:.15em;font-weight:900;color:#929ba4;margin:0 0 7px}.side-card h2{font-size:16px;margin:0 0 13px}.side-card a{display:block;padding:10px 0;border-top:1px solid #eef0f2;font-size:11px;font-weight:700}.side-card small{font-size:10px;line-height:1.6;color:#858f99}@media(max-width:760px){.community-page{padding:20px 14px 50px}.community-header{display:block}.community-header h1{font-size:27px}.community-btn{width:100%;margin-top:15px}.community-layout{grid-template-columns:1fr}.community-side{display:none}.composer{grid-template-columns:34px 1fr}.avatar-small{width:34px;height:34px}.composer-bottom{grid-column:2}.post-actions{gap:12px}}`}</style>
  </main>;
}
