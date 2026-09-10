import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ maxWidth: 560, textAlign: "center" }}>
        <p style={{ letterSpacing: ".16em", fontWeight: 700, opacity: .7 }}>LAKSHYA</p>
        <h1 style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)", margin: "12px 0" }}>That page moved.</h1>
        <p style={{ opacity: .72, lineHeight: 1.6 }}>The link you opened is no longer available. Return to your Lakshya study space and continue learning.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 20, padding: "12px 18px", borderRadius: 12, fontWeight: 700, textDecoration: "none", border: "1px solid currentColor" }}>Open Lakshya →</Link>
      </section>
    </main>
  );
}
