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
            <span className="project-folder-icon"><span>⌘</span><i /></span>
            <span className="project-folder-copy">
              <strong>Project Lab</strong>
              <h2>Educational Template Library</h2>
              <p>30 ready-made study projects for calculators, quizzes, coding tools and useful student utilities.</p>
              <span className="project-actions">
                <em>Open Builder →</em>
                <em>Browse 30+ Templates →</em>
              </span>
            </span>
            <span className="project-folder-glow" />
          </Link>
        </section>
      )}
      {children}
      <style jsx>{`
        .project-folder-wrap{max-width:1080px;margin:14px auto 0;padding:0 28px;animation:projectReveal .45s ease both}
        .project-folder{position:relative;display:flex;align-items:center;gap:17px;overflow:hidden;padding:18px 20px;border:1px solid rgba(99,91,255,.2);border-radius:22px;background:linear-gradient(115deg,#f7f8ff 0%,#eee9ff 52%,#ffe9fa 100%);box-shadow:0 12px 34px rgba(61,52,130,.10);text-decoration:none;color:#20203a;transition:.25s ease}
        .project-folder:hover{transform:translateY(-2px);box-shadow:0 18px 42px rgba(61,52,130,.14);border-color:rgba(99,91,255,.35)}
        .project-folder-icon{position:relative;width:58px;height:58px;flex:0 0 58px;border-radius:17px;background:linear-gradient(135deg,#5368ff,#9b4cff 55%,#ec3fc1);display:grid;place-items:center;color:#fff;box-shadow:0 12px 24px rgba(99,91,255,.26)}
        .project-folder-icon:before{content:"";position:absolute;left:6px;top:-5px;width:24px;height:9px;border-radius:7px 7px 0 0;background:#7380ff}
        .project-folder-icon span{font-size:25px;font-weight:900;z-index:1}.project-folder-icon i{position:absolute;width:9px;height:9px;border-radius:50%;background:#fff;opacity:.85;right:9px;top:9px}
        .project-folder-copy{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}.project-folder-copy strong{font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:#635bff}.project-folder-copy h2{margin:0;font-size:22px;line-height:1.12;letter-spacing:-.6px;color:#25233a}.project-folder-copy p{margin:2px 0 3px;font-size:10px;line-height:1.5;color:#716d7f;max-width:720px}.project-actions{display:flex;gap:16px;flex-wrap:wrap}.project-folder-copy em{font-style:normal;font-size:10px;font-weight:900;color:#5d50dc}
        .project-folder-glow{position:absolute;width:230px;height:230px;border-radius:50%;right:-70px;top:-110px;background:rgba(217,70,239,.15);filter:blur(30px);pointer-events:none}
        @keyframes projectReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @media(max-width:700px){
          .project-folder-wrap{padding:0 14px;margin-top:10px}
          .project-folder{padding:14px 13px;gap:12px;border-radius:18px}
          .project-folder-icon{width:48px;height:48px;flex-basis:48px;border-radius:14px}
          .project-folder-icon span{font-size:20px}.project-folder-copy strong{font-size:8px}.project-folder-copy h2{font-size:16px}.project-folder-copy p{font-size:8px;line-height:1.4;margin-top:2px}.project-folder-copy em{font-size:8px}.project-actions{gap:10px}
        }
        @media(prefers-reduced-motion:reduce){.project-folder-wrap,.project-folder{animation:none;transition:none}}
      `}</style>
    </>
  );
}
