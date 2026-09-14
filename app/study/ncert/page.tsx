"use client";

import Link from "next/link";

const books = [
  { className: "Class XII", title: "Physics Part-I", url: "https://ncert.nic.in/textbook.php?keph1=1-7", note: "Official NCERT textbook portal · chapters + complete book" },
  { className: "Class XII", title: "Chemistry Part-I", url: "https://ncert.nic.in/textbook.php?kech1=5-7", note: "Official NCERT textbook portal · chapters + complete book" },
  { className: "Class XII", title: "Chemistry Part-II", url: "https://ncert.nic.in/textbook.php?lech2=ps-6", note: "Official NCERT textbook portal · chapters + complete book" },
  { className: "Class XII", title: "Biology", url: "https://ncert.nic.in/textbook.php?lebo1=8-12", note: "Official NCERT textbook portal · chapters + complete book" },
];

export default function NcertBooksPage() {
  return <main className="page">
    <header>
      <Link href="/study">← Study</Link>
      <span className="eyebrow">LAKSHYA • NCERT LIBRARY</span>
      <h1>NCERT Books</h1>
      <p>Official NCERT textbook access, kept separate from your private chapter memory.</p>
    </header>

    <section className="hero">
      <div><span className="badge">OFFICIAL SOURCE</span><h2>Read NCERT, then capture what matters.</h2><p>Open the official NCERT textbook portal from Lakshya. Use your chapter workspace to save your own key points, MCQs, flashcards and quick revisions.</p></div>
      <a href="https://ncert.nic.in/textbook.php" target="_blank" rel="noreferrer" className="primary">Open NCERT Textbooks ↗</a>
    </section>

    <section className="grid">{books.map(book => <article key={book.title}><span>{book.className}</span><h3>{book.title}</h3><p>{book.note}</p><a href={book.url} target="_blank" rel="noreferrer">Open Book ↗</a></article>)}</section>

    <section className="note"><b>How this works in Lakshya</b><ol><li>Open the official NCERT book.</li><li>Read a concept or chapter.</li><li>Return to that Lakshya chapter.</li><li>Use <b>AI Capture</b> to turn important learning into MCQs, flashcards, key points or quick revision.</li></ol></section>

    <style jsx>{`body{background:#f6f7fb}.page{max-width:1080px;margin:auto;padding:28px 22px 70px;color:#171a2b}.page header>a{color:#697183;text-decoration:none;font-size:11px;font-weight:800}.eyebrow{display:block;margin-top:22px;font-size:8px;letter-spacing:.16em;color:#9299a8;font-weight:900}.page h1{font-size:32px;margin:6px 0}.page header p{font-size:10px;color:#858c9c;margin:0}.hero{display:flex;align-items:center;justify-content:space-between;gap:18px;background:#fff;border:1px solid #e4e6ef;border-radius:16px;padding:20px;margin:20px 0 14px}.badge{display:inline-block;background:#f0efff;color:#6258df;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:900;letter-spacing:.1em}.hero h2{font-size:20px;margin:9px 0 6px}.hero p{max-width:700px;font-size:10px;line-height:1.6;color:#858c9c;margin:0}.primary{display:inline-block;background:#1b1d2b;color:#fff;text-decoration:none;border-radius:9px;padding:11px 14px;font-size:9px;font-weight:800;white-space:nowrap}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.grid article{background:#fff;border:1px solid #e4e6ef;border-radius:14px;padding:16px}.grid article>span{font-size:8px;color:#9299a8;font-weight:900;letter-spacing:.1em}.grid h3{font-size:15px;margin:8px 0 5px}.grid p{font-size:9px;color:#858c9c;line-height:1.5;margin:0 0 13px}.grid a{font-size:9px;font-weight:800;color:#5d55c9;text-decoration:none}.note{margin-top:14px;background:#faf9ff;border:1px solid #e1defc;border-radius:14px;padding:16px;font-size:10px;line-height:1.7}.note ol{margin:8px 0 0;padding-left:20px;color:#626a7a}@media(max-width:700px){.page{padding:20px 14px 70px}.hero{display:block}.hero .primary{margin-top:14px}.grid{grid-template-columns:1fr}}`}</style>
  </main>;
}
