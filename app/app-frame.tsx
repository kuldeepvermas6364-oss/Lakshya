"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LakshyaAI from "./components/lakshya-ai";
import { useAuth } from "../lib/auth-context";

const primary = [["⌂","Dashboard","/"],["◫","Study","/study"],["✓","Practice","/practice"],["◷","Focus Mode","/focus"],["▤","Notes","/notes"],["↗","Analytics","/analytics"]];
const social = [["◉","Community","/community"],["♙","Friends","/friends"],["▣","Messages","/messages"],["◆","Study Groups","/groups"]];
const extra = [["◎","Goals","/goals"],["↻","Revision","/revision"],["★","Achievements","/achievements"],["♢","Notifications","/notifications"],["◈","Career","/career"]];

function PremiumNavIcon({type}:{type:"home"|"study"|"practice"|"ai"|"community"|"career"}) {
 const common={width:22,height:22,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};
 if(type==="study") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22z"/><path d="M7 7h2M15 7h2"/></svg>;
 if(type==="practice") return <svg {...common}><path d="M7 3.5h10A2.5 2.5 0 0 1 19.5 6v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5z"/><path d="m8 12 2.2 2.2L16.5 8"/><path d="M8 7h2M8 17h2"/></svg>;
 if(type==="ai") return <svg {...common}><path d="m12 2 1.55 5.45L19 9l-5.45 1.55L12 16l-1.55-5.45L5 9l5.45-1.55z"/></svg>;
 if(type==="community") return <svg {...common}><path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM15.8 10a2.5 2.5 0 1 0 0-5"/><path d="M3.5 19.5c.35-3.1 2.2-5 5-5s4.65 1.9 5 5M14 14.7c2.7-.8 5.5.7 6.3 3.8"/></svg>;
 if(type==="career") return <svg {...common}><path d="M4 8.5h16A2 2 0 0 1 22 10.5v8A2 2 0 0 1 20 20.5H4a2 2 0 0 1-2-2v-8A2 2 0 0 1 4 8.5z"/><path d="M8 8.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2.5"/><path d="M2 13h20M10 13v2h4v-2"/></svg>;
 return <svg {...common}><path d="m12 3 2.4 5.1L20 10l-4 3.9.9 5.6-4.9-2.7-4.9 2.7.9-5.6L4 10l5.6-1.9z"/></svg>;
}

export default function AppFrame({children}:{children:React.ReactNode}){
 const pathname=usePathname(); const router=useRouter(); const {user,loading}=useAuth();
 const isAuthRoute=pathname==="/auth"||pathname.startsWith("/auth/");
 useEffect(()=>{if(!loading&&!user&&!isAuthRoute)router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname||"/")}`);},[loading,user,isAuthRoute,pathname,router]);
 if(isAuthRoute)return <>{children}</>;
 if(loading||!user)return <main className="auth-splash"><div className="auth-orbit"><img src="/lakshya-mark.svg" alt="Lakshya"/></div><b>{loading?"Restoring your session…":"Opening secure sign in…"}</b><span>Please wait a moment.</span></main>;
 const active=(href:string)=>pathname===href||(href!=="/"&&pathname.startsWith(href));
 const nav=[["✦","Lakshya AI","/ai"],...primary,...extra,...social];
 return <div className="app-frame">
  <aside className="frame-sidebar"><Link href="/" className="frame-brand"><img src="/lakshya-mark.svg" alt=""/><div><strong>Lakshya</strong><small>STUDY OS</small></div></Link><nav aria-label="Main navigation">{nav.map(([icon,label,href])=><Link key={href} href={href} className={active(href)?"frame-nav active":"frame-nav"}><b>{icon}</b><span>{label}</span></Link>)}</nav><div className="frame-bottom"><Link href="/settings" className={active("/settings")?"frame-nav active":"frame-nav"}>⚙ <span>Settings</span></Link><div className="frame-streak">✦ <span><b>Your progress</b><small>Built from your activity.</small></span></div></div></aside>
  <div className="frame-content"><header className="frame-topbar"><Link href="/" className="frame-mobile-brand"><img src="/lakshya-mark.svg" alt=""/><b>Lakshya</b></Link><div className="frame-search">⌕ <span>Search chapters, notes, questions...</span></div><div className="frame-actions"><Link href="/ai" className="frame-premium-top">✦ Ask AI</Link><Link href="/premium" className="frame-premium-top">✦ Premium</Link><Link href="/notifications" className="frame-icon" aria-label="Notifications">♢</Link><Link href="/profile" className="frame-avatar">K</Link></div></header>{children}</div>
  <nav className="frame-mobile-nav" aria-label="Mobile navigation">{[["home","Home","/"],["study","Study","/study"],["practice","Practice","/practice"],["ai","AI","/ai"],["community","Community","/community"],["career","Career","/career"]].map(([type,label,href])=><Link key={href} href={href} className={active(href)?"active":""}><b><PremiumNavIcon type={type as "home"|"study"|"practice"|"ai"|"community"|"career"}/></b><small>{label}</small></Link>)}</nav>
  <LakshyaAI/>
 </div>;
}
