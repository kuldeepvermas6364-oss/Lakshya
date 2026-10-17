"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { sendFriendRequest } from "@/lib/social-graph";

type Person={uid:string;name:string;handle:string;photoURL?:string};
export default function FriendsPage(){
 const[userId,setUserId]=useState<string|null>(null),[people,setPeople]=useState<Person[]>([]),[sent,setSent]=useState<string[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>onAuthStateChanged(auth,user=>setUserId(user?.uid??null)),[]);
 useEffect(()=>{if(!userId){setLoading(false);return}getDocs(query(collection(db,"users"),limit(30))).then(s=>setPeople(s.docs.map(d=>{const x=d.data();return{uid:d.id,name:x.displayName||x.name||"Student",handle:x.username?`@${x.username}`:x.email?`@${String(x.email).split("@")[0]}`:"@student",photoURL:x.photoURL}}).filter(p=>p.uid!==userId))).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[userId]);
 async function addFriend(uid:string){if(!userId)return;try{await sendFriendRequest(userId,uid);setSent(x=>[...x,uid]);setError("")}catch(e){setError(e instanceof Error?e.message:"Request failed")}}
 return <main className="simple-page"><header className="simple-head"><div><p className="eyebrow">YOUR NETWORK</p><h1>Friends</h1><p className="muted">Real Lakshya users, not sample profiles.</p></div><Link className="secondary" href="/community">Community</Link></header><section className="card-list"><div className="section-title"><h2>People you may know</h2><span>{people.length} users</span></div>{loading?<p className="muted">Loading real users…</p>:people.length===0?<p className="muted">No other registered users found yet.</p>:people.map(p=><article className="person-card" key={p.uid}><div className="avatar large">{p.name[0]?.toUpperCase()||"S"}</div><div className="person-info"><strong>{p.name}</strong><small>{p.handle}</small></div><button className="primary" disabled={sent.includes(p.uid)} onClick={()=>addFriend(p.uid)}>{sent.includes(p.uid)?"Request sent":"Add friend"}</button></article>)}</section>{error&&<p className="muted center">{error}</p>}<section className="safety-box"><strong>🛡️ Study-safe networking</strong><p>Only profiles stored in Firebase are shown. Never share passwords, OTPs or private information.</p></section></main>;
}
