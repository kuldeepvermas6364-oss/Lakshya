"use client";

import { useEffect } from "react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Lakshya client error:", error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#17181c", color: "#fff" }}>
      <section style={{ maxWidth: 520, textAlign: "center" }}>
        <p style={{ letterSpacing: ".16em", fontWeight: 700, opacity: .7 }}>LAKSHYA</p>
        <h1 style={{ fontSize: "clamp(2rem, 8vw, 3.5rem)", margin: "12px 0" }}>Let&apos;s get you back in.</h1>
        <p style={{ opacity: .75, lineHeight: 1.6 }}>A temporary browser-side error interrupted the study space. Your account data is not deleted.</p>
        <button onClick={() => reset()} style={{ marginTop: 20, padding: "12px 20px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 700 }}>Try again</button>
        <button onClick={() => window.location.assign("/?fresh=" + Date.now())} style={{ marginTop: 12, marginLeft: 8, padding: "12px 20px", borderRadius: 12, border: "1px solid currentColor", background: "transparent", color: "inherit", cursor: "pointer", fontWeight: 700 }}>Open fresh</button>
      </section>
    </main>
  );
}
