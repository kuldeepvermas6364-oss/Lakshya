"use client";
import Link from "next/link";
import {useMemo,useState} from "react";

const presets=[
{name:"Parabola",equation:"y = a*x^2",note:"a बदलकर parabola की shape देखें।",min:-2,max:2,step:.1,value:1},
{name:"Line",equation:"y = m*x + c",note:"m slope और c y-intercept है।",min:-3,max:3,step:.1,value:1},
{name:"Sine",equation:"y = a*sin(x)",note:"Amplitude बदलें।",min:.2,max:3,step:.1,value:1},
{name:"Circle",equation:"y = sqrt(r^2-x^2)",note:"Circle का upper half।",min:1,max:10,step:.5,value:5}
];

function fn(raw:string,v:number){
 let e=raw.trim().replace(/^y\s*=\s*/i,"").replace(/π/g,"Math.PI").replace(/\^/g,"**");
 e=e.replace(/\b(sin|cos|tan|sqrt|abs|log|exp)\b/g,"Math.$1").replace(/\bpi\b/gi,"Math.PI").replace(/\be\b/g,"Math.E").replace(/\b(a|m|c|r)\b/g,String(v));
 if(!/^[0-9x+\-*/%().,\sA-Za-z*]+$/.test(e)||/constructor|window|document|globalThis|Function|eval|import/i.test(e))throw new Error();
 return new Function("x","return ("+e+");") as (x:number)=>number;
}
const fmt=(n:number)=>Number(n.toFixed(2)).toString();

export default function EquationVisualizerPage(){
 const [eq,setEq]=useState("y = a*x^2"),[name,setName]=useState("Parabola"),[v,setV]=useState(1),[r,setR]=useState(10),[grid,setGrid]=useState(true);
 const pts=useMemo(()=>{try{const f=fn(eq,v),a:{x:number;y:number}[]=[];for(let i=0;i<=500;i++){const x=-r+2*r*i/500,y=f(x);if(Number.isFinite(y)&&Math.abs(y)<r*8)a.push({x,y})}return a}catch{return[]}},[eq,v,r]);
 const W=760,H=430,p=34,sx=(x:number)=>p+(x+r)/(2*r)*(W-2*p),sy=(y:number)=>H-p-(y+r)/(2*r)*(H-2*p);
 const ticks=Array.from({length:9},(_,i)=>-r+2*r*i/8),path=pts.map((q,i)=>(i?"L":"M")+" "+sx(q.x)+" "+sy(q.y)).join(" "),active=presets.find(x=>x.name===name);
 return <main style={{maxWidth:1160,margin:"0 auto",padding:"18px 24px 120px",minHeight:"100vh",background:"linear-gradient(145deg,#fbfaff,#f3f7ff 55%,#fff4fb)"}}>
 <header style={{display:"flex",gap:14,marginBottom:16}}><Link href="/study" style={{padding:9,border:"1px solid #ddd",borderRadius:12,textDecoration:"none"}}>← Study</Link><div><small>STUDY • MATHEMATICS</small><h1 style={{margin:"3px 0"}}>Equation Visualizer</h1><p style={{margin:0,color:"#777"}}>Equation लिखो और graph तुरंत देखो।</p></div></header>
 <section style={{display:"grid",gridTemplateColumns:"300px minmax(0,1fr)",gap:13}}>
 <div style={{padding:15,border:"1px solid #ddd",borderRadius:18,background:"#ffffffdd"}}>
  <label>Equation / समीकरण<input value={eq} onChange={e=>setEq(e.target.value)} spellCheck={false} placeholder="y = x^2" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:11,border:"1px solid #ddd",borderRadius:10,fontSize:15,fontWeight:800}}/></label>
  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:14}}><b style={{width:"100%",fontSize:9}}>Quick examples</b>{presets.map(x=><button type="button" key={x.name} onClick={()=>{setName(x.name);setEq(x.equation);setV(x.value)}} style={{padding:"7px 9px",border:"1px solid #ddd",borderRadius:9,background:name===x.name?"#ece9ff":"#fff"}}>{x.name}</button>)}</div>
  {active&&<label style={{display:"block",marginTop:15,fontSize:9}}>Parameter = {v}<input type="range" min={active.min} max={active.max} step={active.step} value={v} onChange={e=>setV(Number(e.target.value))} style={{width:"100%"}}/></label>}
  <div style={{display:"flex",gap:6,marginTop:14}}><button type="button" onClick={()=>setR(x=>Math.min(100,x*1.25))}>− Zoom</button><button type="button" onClick={()=>setR(x=>Math.max(.5,x*.8))}>＋ Zoom</button><button type="button" onClick={()=>setR(10)}>Reset</button></div>
  <label style={{display:"block",marginTop:13,fontSize:9}}><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Grid</label>
  <div style={{marginTop:14,padding:10,borderRadius:11,background:"#f5f2ff",fontSize:9}}><b>{active?.name||"Custom equation"}</b><p style={{margin:"4px 0",color:"#777"}}>{active?.note||"y = f(x) format में equation लिखें।"}</p></div>
  {!pts.length&&<p style={{padding:8,color:"#b33",background:"#fff0f0",fontSize:9}}>Equation समझ नहीं आई। उदाहरण: y = x^2</p>}
 </div>
 <div style={{padding:12,border:"1px solid #ddd",borderRadius:18,background:"#ffffffdd",minWidth:0}}>
  <div style={{display:"flex",justifyContent:"space-between"}}><b>Live graph</b><small style={{color:"#498b68"}}>LIVE • ±{fmt(r)}</small></div>
  <div style={{overflow:"auto",marginTop:8}}><svg viewBox={"0 0 "+W+" "+H} role="img" aria-label={"Graph of "+eq} style={{display:"block",width:"100%",minWidth:520,background:"#fff"}}>
   {grid&&ticks.map((t,i)=><g key={i}><line x1={sx(t)} x2={sx(t)} y1={p} y2={H-p} stroke="#e9e7ef"/><line x1={p} x2={W-p} y1={sy(t)} y2={sy(t)} stroke="#e9e7ef"/></g>)}
   <line x1={sx(0)} x2={sx(0)} y1={p} y2={H-p} stroke="#777"/><line x1={p} x2={W-p} y1={sy(0)} y2={sy(0)} stroke="#777"/>
   {ticks.map((t,i)=><g key={"t"+i}><text x={sx(t)} y={sy(0)+16} fontSize="8" fill="#999" textAnchor="middle">{fmt(t)}</text></g>)}
   {path&&<path d={path} fill="none" stroke="#6558d8" strokeWidth="3"/>}
   <text x={W-p} y={sy(0)-6} fontSize="10">x</text><text x={sx(0)+6} y={p+10} fontSize="10">y</text>
  </svg></div>
  <div style={{marginTop:8,padding:9,background:"#f7f5ff",borderRadius:10,fontSize:12}}><b>f(x) = </b>{eq.replace(/^y\s*=\s*/i,"")}</div>
 </div></section>
 <section style={{marginTop:13,padding:15,border:"1px solid #ddd",borderRadius:18,background:"#ffffffdd"}}><b>Equation → Diagram</b><p style={{margin:"5px 0",fontSize:10,color:"#777"}}>आगे इसी workspace में vectors, coordinate geometry, 3D surfaces और AI explanation जोड़े जा सकते हैं।</p></section>
 </main>;
}