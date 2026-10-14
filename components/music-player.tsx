"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Track = { title: string; artist: string; url: string };

function loadTracks(): Track[] {
  const raw = process.env.NEXT_PUBLIC_LAKSHYA_MUSIC_TRACKS;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const tracks = parsed.filter((item): item is Track =>
          !!item && typeof item === "object" &&
          typeof (item as Track).title === "string" &&
          typeof (item as Track).url === "string" &&
          /^https?:\/\//i.test((item as Track).url)
        );
        if (tracks.length) return tracks;
      }
    } catch {
      // Invalid optional playlist configuration falls through to the single-track setting.
    }
  }
  const url = process.env.NEXT_PUBLIC_LAKSHYA_MUSIC_URL?.trim();
  if (url && /^https?:\/\//i.test(url)) {
    return [{ title: process.env.NEXT_PUBLIC_LAKSHYA_MUSIC_TITLE?.trim() || "Focus Session", artist: "Lakshya Focus", url }];
  }
  return [];
}

function timeLabel(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function MusicPlayer({ compact = false }: { compact?: boolean }) {
  const tracks = useMemo(loadTracks, []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState("");

  const track = tracks[index];

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    setCurrent(0);
    setDuration(0);
    setError("");
    setPlaying(false);
    if (audioRef.current) audioRef.current.load();
  }, [index]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !track) return;
    setError("");
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("Song play nahi ho paya. Cloudflare URL, public access aur audio format check karein.");
    }
  }

  function changeTrack(nextIndex: number) {
    if (!tracks.length) return;
    setIndex((nextIndex + tracks.length) % tracks.length);
  }

  return (
    <section className={`music-player ${compact ? "music-player-compact" : "music-player-full"}`} aria-label="Lakshya music player">
      <div className="music-art" aria-hidden="true">
        <span className={playing ? "music-art-disc is-playing" : "music-art-disc"}>♫</span>
        <i /><i /><i /><i /><i />
      </div>
      <div className="music-main">
        <div className="music-kicker"><span className="music-live-dot" /> MUSIC FOR FOCUS</div>
        <h2>{track?.title || "Your focus soundtrack"}</h2>
        <p>{track ? track.artist || "Lakshya Focus" : "Add your Cloudflare song link to start listening."}</p>
        {track && (
          <audio
            ref={audioRef}
            src={track.url}
            preload="metadata"
            loop={tracks.length === 1}
            onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => changeTrack(index + 1)}
            onError={() => { setPlaying(false); setError("Audio load nahi hua. Link public HTTPS audio file hona chahiye."); }}
          />
        )}
        <div className="music-controls">
          <button type="button" className="music-skip" onClick={() => changeTrack(index - 1)} disabled={tracks.length < 2} aria-label="Previous song">|◀</button>
          <button type="button" className="music-play" onClick={togglePlayback} disabled={!track} aria-label={playing ? "Pause song" : "Play song"}>{playing ? "Ⅱ" : "▶"}</button>
          <button type="button" className="music-skip" onClick={() => changeTrack(index + 1)} disabled={tracks.length < 2} aria-label="Next song">▶|</button>
          <div className="music-timeline">
            <input aria-label="Song position" type="range" min={0} max={Math.max(duration, 1)} step={1} value={Math.min(current, duration || 1)} disabled={!track || !duration} onChange={(event) => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setCurrent(value); }} />
            <div><span>{timeLabel(current)}</span><span>{timeLabel(duration)}</span></div>
          </div>
        </div>
        <div className="music-volume">
          <label htmlFor={compact ? "music-volume-mini" : "music-volume-full"}>Volume</label>
          <input id={compact ? "music-volume-mini" : "music-volume-full"} aria-label="Volume" type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          {tracks.length > 1 && <span>{index + 1} / {tracks.length} tracks</span>}
        </div>
        {!track && <p className="music-config-note">Vercel Environment Variables: <code>NEXT_PUBLIC_LAKSHYA_MUSIC_TRACKS</code> (JSON playlist) ya <code>NEXT_PUBLIC_LAKSHYA_MUSIC_URL</code> set karein. URL aapke public Cloudflare R2/custom domain ka direct audio link hona chahiye.</p>}
        {error && <p className="music-error" role="status">{error}</p>}
      </div>
    </section>
  );
}
