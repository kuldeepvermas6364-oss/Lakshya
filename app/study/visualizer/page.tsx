"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const presets = [
  {name:"Parabola",equation:"y = a*x^2",note:"a बदलकर parabola की shape देखें।",min:-2,max:2,step:.1,value:1},
  {name:"Line",equation:"y = m*x + c",note:"m slope और c y-intercept है।",min:-3,max:3,step:.1,value:1},
  {name:"Sine",equation:"y = a*sin(x)",note:"Amplitude बदलें।",min:.2,max:3,step:.1,value:1},
  {name:"Circle",equation:"y = sqrt(r^2-x^2)",note:"Circle का upper half।",min:1,max:10,step:.5,value:5}
];

type Tool = "select"|"point"|"segment"|"line"|"circle"|"triangle"|"angle"|"distance";
type Point = {id:number;x:number;y:number};
type Construction = {tool:Exclude<Tool,"select"|"point">;ids:number[]};

function fn(raw:string,v:number){
  let e=raw.trim().replace(/^y\s*=\s*/i,"").replace(/π/g,"Math.PI").replace(/\^/g,"**");
  e=e.replace(/\b(sin|cos|tan|sqrt|abs|log|exp)\b/g,"Math.$1").replace(/\bpi\b/gi,"Math.PI").replace(/\be\b/g,"Math.E").replace(/\b(a|m|c|r)\b/g,String(v));
  if(!/^[0-9x+\-*/%().,\sA-Za-z*]+$/.test(e)||/constructor|window|document|globalThis|Function|eval|import/i.test(e))throw new Error();
  return new Function("x","return ("+e+");") as (x:number)=>number;
}
const fmt=(n:number)=>Number(n.toFixed(2)).toString();
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleAt=(a:Point,b:Point,c:Point)=>{
  const ux=a.x-b.x,uy=a.y-b.y,vx=c.x-b.x,vy=c.y-b.y;
  const d=Math.hypot(ux,uy)*Math.hypot(vx,vy);
  return d?Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/d)))*180/Math.PI:0;
};

export default function EquationVisualizerPage(){
  const [eq,setEq]=useState("y = a*x^2"),[name,setName]=useState("Parabola"),[v,setV]=useState(1),[r,setR]=useState(10),[grid,setGrid]=useState(true);
  const [tool,setTool]=useState<Tool>("select"),[points,setPoints]=useState<Point[]>([]),[shapes,setShapes]=useState<Construction[]>([]);
  const [pending,setPending]=useState<number[]>([]),[dragId,setDragId]=useState<number|null>(null);
  const svgRef=useRef<SVGSVGElement|null>(null);

  const pts=useMemo(()=>{try{const f=fn(eq,v),a:{x:number;y:number}[]=[];for(let i=0;i<=500;i++){const x=-r+2*r*i/500,y=f(x);if(Number.isFinite(y)&&Math.abs(y)<r*8)a.push({x,y})}return a}catch{return[]}},[eq,v,r]);
  const W=760,H=430,p=34,sx=(x:number)=>p+(x+r)/(2*r)*(W-2*p),sy=(y:number)=>H-p-(y+r)/(2*r)*(H-2*p);
  const inv=(clientX:number,clientY:number)=>{
    const box=svgRef.current?.getBoundingClientRect(); if(!box)return {x:0,y:0};
    return {x:((clientX-box.left)/box.width)*(2*r)-r,y:r-((clientY-box.top)/box.height)*(2*r)};
  };
  const ticks=Array.from({length:9},(_,i)=>-r+2*r*i/8),path=pts.map((q,i)=>(i?"L":"M")+" "+sx(q.x)+" "+sy(q.y)).join(" "),active=presets.find(x=>x.name===name);

  const requirements:Record<Tool,number>={select:0,point:1,segment:2,line:2,circle:2,triangle:3,angle:3,distance:2};
  const toolLabel:Record<Tool,string>={select:"Select / Move",point:"Point",segment:"Segment",line:"Line",circle:"Circle",triangle:"Triangle",angle:"Angle",distance:"Distance"};

  function chooseTool(t:Tool){setTool(t);setPending([]);}
  function addPointAt(x:number,y:number){
    if(tool==="select")return;
    const id=Date.now()+Math.floor(Math.random()*1000), np={id,x:Math.max(-r,Math.min(r,x)),y:Math.max(-r,Math.min(r,y))};
    setPoints(prev=>[...prev,np]);
    if(tool==="point"){setPending([]);return;}
    const next=[...pending,id], need=requirements[tool];
    if(next.length===need){setShapes(prev=>[...prev,{tool:tool as Exclude<Tool,"select"|"point">,ids:next}]);setPending([]);setTool("select");}
    else setPending(next);
  }
  function movePoint(clientX:number,clientY:number){
    if(dragId===null)return; const q=inv(clientX,clientY);
    setPoints(prev=>prev.map(pt=>pt.id===dragId?{...pt,x:Math.max(-r,Math.min(r,q.x)),y:Math.max(-r,Math.min(r,q.y))}:pt));
  }
  function undo(){if(points.length){const last=points[points.length-1];setPoints(points.slice(0,-1));setShapes(shapes.map(s=>({...s,ids:s.ids.filter(id=>id!==last.id)})).filter(s=>s.ids.length));return;}setShapes(shapes.slice(0,-1));}
  function get(id:number){return points.find(x=>x.id===id);}

  const shapeSvg=shapes.map((s,i)=>{
    const q=s.ids.map(get).filter(Boolean) as Point[];
    if(s.tool==="segment"&&q.length===2)return <line key={i} x1={sx(q[0].x)} y1={sy(q[0].y)} x2={sx(q[1].x)} y2={sy(q[1].y)} stroke="#ef6b7a" strokeWidth="3"/>;
    if(s.tool==="line"&&q.length===2){
      const dx=q[1].x-q[0].x,dy=q[1].y-q[0].y,len=Math.hypot(dx,dy)||1, k=100;
      return <line key={i} x1={sx(q[0].x-dx/len*k)} y1={sy(q[0].y-dy/len*k)} x2={sx(q[0].x+dx/len*k)} y2={sy(q[0].y+dy/len*k)} stroke="#ff9f43" strokeWidth="3"/>;
    }
    if(s.tool==="circle"&&q.length===2){const rr=distance(q[0],q[1]);return <circle key={i} cx={sx(q[0].x)} cy={sy(q[0].y)} r={Math.abs(sx(rr)-sx(0))} fill="#8bd3dd33" stroke="#20a0b0" strokeWidth="3"/>;}
    if(s.tool==="triangle"&&q.length===3)return <polygon key={i} points={q.map(pt=>sx(pt.x)+","+sy(pt.y)).join(" ")} fill="#a78bfa22" stroke="#7c5ce3" strokeWidth="3"/>;
    if(s.tool==="angle"&&q.length===3){const a=angleAt(q[0],q[1],q[2]);return <g key={i}><polyline points={q.map(pt=>sx(pt.x)+","+sy(pt.y)).join(" ")} fill="none" stroke="#e67e22" strokeWidth="3"/><text x={sx(q[1].x)+8} y={sy(q[1].y)-8} fontSize="12" fontWeight="700">{fmt(a)}°</text></g>;}
    if(s.tool==="distance"&&q.length===2){const d=distance(q[0],q[1]);return <g key={i}><line x1={sx(q[0].x)} y1={sy(q[0].y)} x2={sx(q[1].x)} y2={sy(q[1].y)} stroke="#20a05a" strokeWidth="3" strokeDasharray="7 5"/><text x={(sx(q[0].x)+sx(q[1].x))/2} y={(sy(q[0].y)+sy(q[1].y))/2-8} fontSize="12" fontWeight="700" fill="#16844a">{fmt(d)} units</text></g>;}
    return null;
  });

  return <main style={{maxWidth:1160,margin:"0 auto",padding:"clamp(10px,3vw,18px) clamp(10px,4vw,24px) 90px",minHeight:"100vh",background:"linear-gradient(145deg,#fbfaff,#f3f7ff 55%,#fff4fb)",overflowX:"hidden"}}><header style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,flexWrap:"wrap"}}><Link href="/study" style={{padding:"9px 11px",border:"1px solid #ddd",borderRadius:12,textDecoration:"none",background:"#ffffffdd",fontWeight:700}}>← Study</Link><div style={{minWidth:0,flex:1}}><small>STUDY • MATHEMATICS</small><h1 style={{margin:"3px 0",fontSize:"clamp(22px,6vw,32px)",lineHeight:1.1}}>Equation Visualizer</h1><p style={{margin:0,color:"#777",fontSize:13}}>Equation, graph और geometry एक ही workspace में।</p></div></header><section style={{display:"grid",gridTemplateColumns:"minmax(0,300px) minmax(0,1fr)",gap:12}}><div style={{padding:"clamp(11px,3vw,15px)",border:"1px solid #ddd",borderRadius:18,background:"#ffffffdd",minWidth:0}}><label>Equation / समीकरण<input value={eq} onChange={e=>setEq(e.target.value)} spellCheck={false} placeholder="y = x^2" style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:12,border:"1px solid #ddd",borderRadius:10,fontSize:16,fontWeight:800}}/></label><div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}><b style={{width:"100%",fontSize:10}}>Quick examples</b>{presets.map(x=><button type="button" key={x.name} onClick={()=>{setName(x.name);setEq(x.equation);setV(x.value)}} style={{padding:"9px 10px",border:"1px solid #ddd",borderRadius:10,background:name===x.name?"#ece9ff":"#fff",fontSize:13}}>{x.name}</button>)}</div>{active&&<label style={{display:"block",marginTop:14,fontSize:11}}>Parameter = {v}<input type="range" min={active.min} max={active.max} step={active.step} value={v} onChange={e=>setV(Number(e.target.value))} style={{width:"100%",height:32}}/></label>}<div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6,marginTop:12}}><button type="button" onClick={()=>setR(x=>Math.min(100,x*1.25))}>− Zoom</button><button type="button" onClick={()=>setR(x=>Math.max(.5,x*.8))}>＋ Zoom</button><button type="button" onClick={()=>setR(10)}>Reset</button></div><label style={{display:"block",marginTop:11,fontSize:11}}><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/> Grid</label>{!pts.length&&<p style={{padding:8,color:"#b33",background:"#fff0f0",fontSize:11}}>Equation समझ नहीं आई। उदाहरण: y = x^2</p>}<div style={{marginTop:14,borderTop:"1px solid #eee",paddingTop:12}}><b>Geometry Tools</b><div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:6,marginTop:8}}>{(["select","point","segment","line","circle","triangle","angle","distance"] as Tool[]).map(t=><button key={t} type="button" onClick={()=>chooseTool(t)} style={{minHeight:42,padding:"8px 5px",border:"1px solid #ddd",borderRadius:10,background:tool===t?"#e9e4ff":"#fff",fontWeight:tool===t?800:500,fontSize:12}}>{toolLabel[t]}</button>)}</div><div style={{marginTop:8,fontSize:11,color:"#666",lineHeight:1.35}}>{tool==="select"?"Drag any point to move the construction.":tool==="point"?"Tap graph to place a point.":"Tap "+requirements[tool]+" point"+(requirements[tool]>1?"s":"")+" to create "+toolLabel[tool].toLowerCase()+"."}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}><button type="button" onClick={undo}>↶ Undo</button><button type="button" onClick={()=>{setPoints([]);setShapes([]);setPending([]);}}>Clear</button></div></div></div><div style={{padding:"clamp(8px,2vw,12px)",border:"1px solid #ddd",borderRadius:18,background:"#ffffffdd",minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><b>Interactive workspace</b><small style={{color:tool==="select"?"#498b68":"#7655d6"}}>{toolLabel[tool]} {pending.length?"• "+pending.length+"/"+requirements[tool]:""}</small></div><div style={{marginTop:8,width:"100%",aspectRatio:"760 / 430",overflow:"hidden",borderRadius:12,background:"#fff"}}><svg ref={svgRef} viewBox={"0 0 "+W+" "+H} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive graph and geometry workspace" style={{display:"block",width:"100%",height:"100%",background:"#fff",touchAction:"none",cursor:tool==="select"?"default":"crosshair"}} onPointerDown={e=>{if(e.target===e.currentTarget||e.target.tagName==="svg"){const q=inv(e.clientX,e.clientY);addPointAt(q.x,q.y);}}} onPointerMove={e=>movePoint(e.clientX,e.clientY)} onPointerUp={()=>setDragId(null)} onPointerCancel={()=>setDragId(null)}>{grid&&ticks.map((t,i)=><g key={i}><line x1={sx(t)} x2={sx(t)} y1={p} y2={H-p} stroke="#e9e7ef"/><line x1={p} x2={W-p} y1={sy(t)} y2={sy(t)} stroke="#e9e7ef"/></g>)}<line x1={sx(0)} x2={sx(0)} y1={p} y2={H-p} stroke="#777"/><line x1={p} x2={W-p} y1={sy(0)} y2={sy(0)} stroke="#777"/>{ticks.map((t,i)=><text key={"t"+i} x={sx(t)} y={sy(0)+16} fontSize="8" fill="#999" textAnchor="middle">{fmt(t)}</text>)}{path&&<path d={path} fill="none" stroke="#6558d8" strokeWidth="3"/>}{shapeSvg}{points.map(pt=><g key={pt.id} onPointerDown={e=>{e.stopPropagation();setDragId(pt.id)}}><circle cx={sx(pt.x)} cy={sy(pt.y)} r="7" fill="#fff" stroke="#6558d8" strokeWidth="3"/><text x={sx(pt.x)+9} y={sy(pt.y)-9} fontSize="10" fontWeight="700">({fmt(pt.x)}, {fmt(pt.y)})</text></g>)}{pending.map(id=>{const pt=get(id);return pt?<circle key={"p"+id} cx={sx(pt.x)} cy={sy(pt.y)} r="11" fill="none" stroke="#ff9f43" strokeWidth="2" strokeDasharray="3 3"/>:null})}<text x={W-p} y={sy(0)-6} fontSize="10">x</text><text x={sx(0)+6} y={p+10} fontSize="10">y</text></svg></div><div style={{marginTop:8,padding:9,background:"#f7f5ff",borderRadius:10,fontSize:12,overflowWrap:"anywhere"}}><b>f(x) = </b>{eq.replace(/^y\s*=\s*/i,"")} {shapes.length?<span style={{marginLeft:10,color:"#666"}}>• {shapes.length} construction{shapes.length>1?"s":""}</span>:null}</div></div></section><section style={{marginTop:12,padding:"12px 14px",border:"1px solid #ddd",borderRadius:18,background:"#ffffffdd"}}><b>Step 2 complete: Geometry workspace</b><p style={{margin:"5px 0",fontSize:11,color:"#777",lineHeight:1.4}}>Points, segments, lines, circles, triangles, angles और distances interactive हैं।</p></section><style jsx>{`@media (max-width:720px){main{padding-left:10px!important;padding-right:10px!important}button{min-height:40px}}`}</style></main>;\n}