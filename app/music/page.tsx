"use client";

import Link from "next/link";
import MusicPlayer from "@/components/music-player";

export default function MusicPage() {
  return (
    <main className="page lakshya-music-page">
      <Link href="/" className="music-back-link">← Back to home</Link>
      <section className="music-page-hero">
        <span className="home-eyebrow">LAKSHYA SOUND SPACE</span>
        <h1>Make room for focus.</h1>
        <p>Soft background music for revision, practice and deep-work sessions.</p>
      </section>
      <MusicPlayer />
      <section className="music-guidelines">
        <span aria-hidden="true">✦</span>
        <div><strong>Built for study sessions</strong><p>Use low volume during revision, or pause music when you need full attention for difficult problems. Playback starts only when you press play.</p></div>
      </section>
    </main>
  );
}
