"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBuilder = pathname === "/study/projects" || pathname.startsWith("/study/projects/");

  return (
    <>
      {!isBuilder && (
        <section className="project-folder-wrap" aria-label="Project Builder">
          <Link href="/study/projects" className="project-folder">
            <span className="project-folder-icon"><span>⌘</span><i /></span>
            <span className="project-folder-copy"><strong>Project Lab</strong><small>Build your own website or coding project with live preview, templates & AI help</small><em>Open Builder →</em></span>
            <span className="project-folder-glow" />
          </Link>
          <style jsx>{`
            .project-folder-wrap{max-width:1080px;margin:18px auto 0;padding:0 34px;animation:projectReveal .65s cubic-bezier(.2,.8,.2,1) both}
            .project-folder{position:relative;display:flex;align-items:center;gap:15px;overflow:hidden;padding:15px 17px;border:1px solid rgba(99,91,255,.2);border-radius:18px;background:linear-gradient(115deg,#ffffff 0%,#f7f5ff 58%,#fff4fb 100%);box-shadow:0 10px 30px rgba(61,52,130,.08);text-decoration:none;color:#171a2b;transition:transform .28s ease,box-shadow .28s ease,border-color .28s ease}
            .project-folder:hover{transform:translateY(-3px);border-color:rgba(99,91,255,.42);box-shadow:0 16px 38px rgba(61,52,130,.14)}
            .project-folder-icon{position:relative;width:50px;height:43px;flex:0 0 50px;border-radius:13px;background:linear-gradient(135deg,#635bff,#9b5cff 55%,#ec4899);display:grid;place-items:center;color:#fff;box-shadow:0 10px 22px rgba(99,91,255,.24);transform:perspective(70px) rotateX(4deg);transition:transform .35s ease}
            .project-folder:hover .project-folder-icon{transform:perspective(70px) rotateX(0) rotate(-3deg) scale(1.05)}
            .project-folder-icon:before{content:"";position:absolute;left:5px;top:-4px;width:20px;height:8px;border-radius:6px 6px 0 0;background:#7b70ff}
            .project-folder-icon span{font-size:19px;font-weight:900;z-index:1}.project-folder-icon i{position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;opacity:.8;right:8px;top:8px;animation:projectPulse 1.8s ease-in-out infinite}
            .project-folder-copy{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}.project-folder-copy strong{font-size:14px;letter-spacing:-.2px}.project-folder-copy small{font-size:9px;line-height:1.5;color:#737a8b;max-width:650px}.project-folder-copy em{font-style:normal;font-size:9px;font-weight:900;color:#635bff;margin-top:2px}
            .project-folder-glow{position:absolute;width:160px;height:160px;border-radius:50%;right:-50px;top:-80px;background:rgba(217,70,239,.12);filter:blur(24px);pointer-events:none;transition:transform .5s ease}.project-folder:hover .project-folder-glow{transform:scale(1.35)}
            @keyframes projectReveal{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}@keyframes projectPulse{0%,100%{transform:scale(.8);opacity:.5}50%{transform:scale(1.2);opacity:1}}
            @media(max-width:700px){.project-folder-wrap{padding:0 14px;margin-top:12px}.project-folder{padding:13px}.project-folder-copy small{font-size:8px}.project-folder-icon{width:44px;height:39px;flex-basis:44px}.project-folder-copy em{font-size:8px}}
            @media(prefers-reduced-motion:reduce){.project-folder-wrap,.project-folder-icon,.project-folder-icon i{animation:none}.project-folder,.project-folder-icon,.project-folder-glow{transition:none}}
          `}</style>
        </section>
      )}
      {children}
    </>
  );
}
