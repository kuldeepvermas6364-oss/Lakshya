"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBuilder = pathname === "/study/projects" || pathname.startsWith("/study/projects/");

  return (
    <>
      {!isBuilder && (
        <section className="project-folder-wrap" aria-label="Project Lab">
          <Link href="/study/projects" className="project-folder">
            <span className="project-folder-icon" aria-hidden="true"><span>⌘</span><i /></span>
            <span className="project-folder-copy">
              <strong>Project Lab</strong>
              <b>30+ ready-made study tools</b>
              <small>Calculators, quizzes, coding projects & student utilities</small>
            </span>
            <span className="project-actions">
              <em>Open Builder →</em>
              <em>Templates →</em>
            </span>
            <span className="project-folder-glow" aria-hidden="true" />
          </Link>
        </section>
      )}

      {children}

      <style jsx>{`
        .project-folder-wrap{
          width:100%;
          max-width:1080px;
          margin:10px auto 0;
          padding:0 28px;
          animation:projectReveal .35s ease both;
        }
        .project-folder{
          position:relative;
          display:flex;
          align-items:center;
          gap:14px;
          min-height:74px;
          padding:10px 14px;
          overflow:hidden;
          border:1px solid rgba(99,91,255,.16);
          border-radius:18px;
          background:linear-gradient(105deg,#f4f5ff 0%,#eeeaff 52%,#ffeef9 100%);
          box-shadow:0 8px 24px rgba(61,52,130,.07);
          text-decoration:none;
          color:#27243a;
          transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease;
        }
        .project-folder:hover{
          transform:translateY(-2px);
          border-color:rgba(99,91,255,.32);
          box-shadow:0 13px 30px rgba(61,52,130,.11);
        }
        .project-folder-icon{
          position:relative;
          width:48px;
          height:48px;
          flex:0 0 48px;
          border-radius:14px;
          background:linear-gradient(135deg,#5b68ff,#914cff 55%,#df45c4);
          display:grid;
          place-items:center;
          color:#fff;
          box-shadow:0 8px 20px rgba(99,91,255,.22);
        }
        .project-folder-icon:before{
          content:"";
          position:absolute;
          left:5px;
          top:-4px;
          width:20px;
          height:8px;
          border-radius:6px 6px 0 0;
          background:#7884ff;
        }
        .project-folder-icon span{font-size:20px;font-weight:900;z-index:1}
        .project-folder-icon i{
          position:absolute;
          width:7px;
          height:7px;
          right:8px;
          top:8px;
          border-radius:50%;
          background:#fff;
          opacity:.85;
        }
        .project-folder-copy{
          display:flex;
          flex-direction:column;
          gap:2px;
          min-width:0;
          flex:1;
        }
        .project-folder-copy strong{
          font-size:9px;
          letter-spacing:.9px;
          text-transform:uppercase;
          color:#6258d9;
        }
        .project-folder-copy b{
          font-size:15px;
          line-height:1.15;
          color:#29263b;
          letter-spacing:-.2px;
        }
        .project-folder-copy small{
          font-size:9px;
          line-height:1.3;
          color:#858091;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .project-actions{
          display:flex;
          align-items:center;
          gap:7px;
          flex-shrink:0;
        }
        .project-folder-copy em,.project-actions em{
          font-style:normal;
          font-size:9px;
          font-weight:900;
          color:#5d51d8;
          white-space:nowrap;
        }
        .project-actions em{
          padding:8px 10px;
          border-radius:10px;
          background:rgba(255,255,255,.56);
          border:1px solid rgba(99,91,255,.12);
        }
        .project-folder-glow{
          position:absolute;
          width:170px;
          height:170px;
          right:-55px;
          top:-90px;
          border-radius:50%;
          background:rgba(218,70,239,.10);
          filter:blur(25px);
          pointer-events:none;
        }
        @keyframes projectReveal{
          from{opacity:0;transform:translateY(6px)}
          to{opacity:1;transform:none}
        }
        @media(max-width:700px){
          .project-folder-wrap{padding:0 14px;margin-top:8px}
          .project-folder{min-height:66px;padding:9px 10px;gap:10px;border-radius:16px}
          .project-folder-icon{width:42px;height:42px;flex-basis:42px;border-radius:12px}
          .project-folder-icon span{font-size:18px}
          .project-folder-copy strong{font-size:7px}
          .project-folder-copy b{font-size:13px}
          .project-folder-copy small{font-size:7.5px}
          .project-actions{gap:5px}
          .project-actions em{font-size:7px;padding:7px 8px}
        }
        @media(max-width:430px){
          .project-folder-copy small{display:none}
          .project-folder-copy b{font-size:12px}
          .project-actions em:first-child{display:none}
        }
        @media(prefers-reduced-motion:reduce){
          .project-folder-wrap,.project-folder{animation:none;transition:none}
        }
      `}</style>
    </>
  );
}
