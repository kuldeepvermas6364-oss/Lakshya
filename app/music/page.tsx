"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type Track = {
  id: string; name: string; artist: string; album?: string; albumArt?: string;
  previewUrl: string; spotifyUrl?: string; duration?: number; rank?: number;
};
type MusicResponse = {
  query: string; category: string | null; page: number; limit: number;
  total: number; hasMore: boolean; tracks: Track[]; error?: string;
};
const categories = [
  { label: "For You 🇮🇳", value: "" }, { label: "India Trending", value: "india-trending" },
  { label: "Bollywood", value: "bollywood" }, { label: "Punjabi", value: "punjabi" },
  { label: "Bhojpuri", value: "bhojpuri" }, { label: "Haryanvi", value: "haryanvi" },
  { label: "South Indian", value: "south-indian" }, { label: "Romantic", value: "romantic" },
  { label: "Lo-fi", value: "lofi" }, { label: "Devotional", value: "devotional" },
  { label: "Party", value: "party" }, { label: "Sad", value: "sad" },
  { label: "Focus / Study", value: "focus" }, { label: "International", value: "international" },
];
function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "Preview";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function MusicPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favoriteTracks, setFavoriteTracks] = useState<Track[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("lakshya_music_favorites");
      if (stored) setFavoriteTracks(JSON.parse(stored) as Track[]);
    } catch { /* Optional browser storage; browsing still works without it. */ }
  }, []);

  const loadTracks = useCallback(async (nextPage: number, append: boolean) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    if (append) setLoadingMore(true); else setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(nextPage), limit: "24" });
    if (submittedSearch.trim()) params.set("q", submittedSearch.trim());
    if (category) params.set("category", category);
    try {
      const response = await fetch(`/api/music?${params.toString()}`, { signal: controller.signal, cache: "no-store" });
      const data = (await response.json()) as MusicResponse;
      if (!response.ok) throw new Error(data.error || "Could not load music.");
      setTracks((previous) => {
        const merged = append ? [...previous, ...data.tracks] : data.tracks;
        return merged.filter((track, index) => merged.findIndex((item) => item.id === track.id) === index);
      });
      setPage(data.page || nextPage);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Music could not be loaded.");
      if (!append) setTracks([]);
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false); }
    }
  }, [submittedSearch, category]);

  useEffect(() => {
    void loadTracks(1, false);
    return () => requestRef.current?.abort();
  }, [loadTracks]);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    if (isPlaying) {
      void audioRef.current.play().catch(() => {
        setIsPlaying(false);
        setError("This preview could not start. Try another song.");
      });
    } else audioRef.current.pause();
  }, [currentTrack, isPlaying]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowFavorites(false);
    setSubmittedSearch(search.trim());
  }
  function playTrack(track: Track) {
    setError("");
    if (currentTrack?.id === track.id) { setIsPlaying((playing) => !playing); return; }
    setCurrentTrack(track);
    setIsPlaying(true);
  }
  function toggleFavorite(track: Track) {
    setFavoriteTracks((previous) => {
      const next = previous.some((item) => item.id === track.id)
        ? previous.filter((item) => item.id !== track.id)
        : [track, ...previous];
      try { window.localStorage.setItem("lakshya_music_favorites", JSON.stringify(next)); }
      catch { setError("Favorites cannot be saved on this browser, but you can still play music."); }
      return next;
    });
  }
  function selectCategory(value: string) {
    setCategory(value); setShowFavorites(false); setSubmittedSearch(""); setSearch("");
  }
  const visibleTracks = showFavorites ? favoriteTracks : tracks;

  return (
    <main className="page music-page">
      <header className="music-heading">
        <div className="music-heading-copy">
          <span className="music-eyebrow"><span className="music-live-dot" /> LAKSHYA MUSIC</span>
          <h1>Your study soundtrack.</h1>
          <p>India-first music discovery, made for your mood. Explore Bollywood, Punjabi, Bhojpuri, Haryanvi and regional sounds, with international music kept in its own lane.</p>
        </div>
        <div className="music-heading-note" aria-label="Music preview service"><span>♫</span><b>Made for your moments</b><small>Search • Discover • Focus</small></div>
      </header>
      <section className="music-hero-card">
        <div className="music-hero-glow" /><div className="music-hero-disc" aria-hidden="true"><span>♫</span></div>
        <div className="music-hero-copy"><span>PRESS PLAY ON YOUR DAY</span><h2>A little music. A better mood.</h2><p>Discover songs across moods and genres. Tap any track to play its available preview.</p></div>
        <div className="music-hero-wave" aria-hidden="true">{Array.from({length:15},(_,i)=><i key={i}/>)}</div>
      </section>
      <section className="music-tools">
        <form className="music-search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search songs, artists, albums..." aria-label="Search songs, artists, albums" maxLength={120}/>
          {search && <button type="button" className="music-clear" onClick={()=>{setSearch("");setSubmittedSearch("");}} aria-label="Clear search">×</button>}
          <button type="submit" className="music-search-button">Search</button>
        </form>
        <button type="button" className={showFavorites?"music-favorites active":"music-favorites"} onClick={()=>setShowFavorites((value)=>!value)}>♡ <span>My favorites</span> <b>{favoriteTracks.length}</b></button>
      </section>
      <nav className="music-categories" aria-label="Music categories">
        {categories.map((item)=><button key={item.value||"all"} type="button" className={!showFavorites&&category===item.value?"active":""} onClick={()=>selectCategory(item.value)}>{item.label}</button>)}
      </nav>
      <section className="music-results">
        <div className="music-results-head">
          <div><span className="music-eyebrow">{showFavorites?"YOUR COLLECTION":category?category.toUpperCase():submittedSearch?"SEARCH RESULTS":"INDIA-FIRST DISCOVERY"}</span><h2>{showFavorites?"Saved favorites":submittedSearch?`Results for “${submittedSearch}”`:category?`${categories.find((item)=>item.value===category)?.label||category} mix`:"Made for you, made for India"}</h2></div>
          {!showFavorites&&!loading&&<span className="music-count">{total.toLocaleString()} tracks found</span>}
        </div>
        {error&&<div className="music-error" role="status"><span>!</span><div><b>Music service notice</b><p>{error}</p><button type="button" onClick={()=>void loadTracks(1,false)}>Try again</button></div></div>}
        {loading ? <div className="music-track-grid" aria-label="Loading music">{Array.from({length:8},(_,i)=><div className="music-skeleton" key={i}><i/><span/><small/></div>)}</div> :
          visibleTracks.length ? <div className="music-track-grid">{visibleTracks.map((track,index)=>{
            const active=currentTrack?.id===track.id;
            const favorite=favoriteTracks.some((item)=>item.id===track.id);
            return <article className={active?"music-track-card playing":"music-track-card"} key={track.id}>
              <button className="music-art-button" type="button" onClick={()=>playTrack(track)} aria-label={`${active&&isPlaying?"Pause":"Play"} ${track.name}`}>
                {track.albumArt?<img src={track.albumArt} alt="" loading="lazy"/>:<span className="music-art-fallback">♫</span>}
                <span className="music-art-overlay">{active&&isPlaying?"Ⅱ":"▶"}</span>{active&&isPlaying&&<span className="music-playing-bars"><i/><i/><i/></span>}
              </button>
              <div className="music-track-info"><strong title={track.name}>{track.name}</strong><span title={track.artist}>{track.artist}</span><small>{formatDuration(track.duration)}{track.album?` · ${track.album}`:""}</small></div>
              <div className="music-track-actions"><button type="button" className={favorite?"music-heart saved":"music-heart"} onClick={()=>toggleFavorite(track)} aria-label={favorite?"Remove favorite":"Save favorite"}>{favorite?"♥":"♡"}</button><button type="button" className="music-play-small" onClick={()=>playTrack(track)} aria-label={active&&isPlaying?"Pause track":"Play track"}>{active&&isPlaying?"Ⅱ":"▶"}</button></div>
              <span className="music-track-index">{String(index+1).padStart(2,"0")}</span>
            </article>;
          })}</div> :
          <div className="music-empty"><span>{showFavorites?"♡":"♫"}</span><h3>{showFavorites?"No favorites saved yet":"No tracks found"}</h3><p>{showFavorites?"Tap the heart on any song to keep it here.":"Try a different song, artist or category."}</p>{showFavorites&&<button type="button" onClick={()=>setShowFavorites(false)}>Explore music</button>}</div>}
        {!loading&&!showFavorites&&hasMore&&tracks.length>0&&<div className="music-load-more"><button type="button" disabled={loadingMore} onClick={()=>void loadTracks(page+1,true)}>{loadingMore?"Loading more…":"Load more tracks →"}</button></div>}
      </section>
      <p className="music-attribution">Music previews and artwork are provided by the Lakshya music service. Availability and preview length may vary by track; full-track playback is not guaranteed.</p>
      <audio ref={audioRef} src={currentTrack?.previewUrl} preload="none" onPlay={()=>setIsPlaying(true)} onPause={()=>setIsPlaying(false)} onEnded={()=>setIsPlaying(false)} onError={()=>{if(currentTrack){setIsPlaying(false);setError("This song preview is unavailable right now. Choose another track.");}}}/>
      {currentTrack&&<aside className="music-player-bar" aria-label="Music player">
        {currentTrack.albumArt?<img src={currentTrack.albumArt} alt=""/>:<span className="music-player-fallback">♫</span>}
        <div className="music-player-track"><strong>{currentTrack.name}</strong><span>{currentTrack.artist}</span></div>
        <div className="music-player-controls"><button type="button" onClick={()=>setIsPlaying((playing)=>!playing)} aria-label={isPlaying?"Pause":"Play"}>{isPlaying?"Ⅱ":"▶"}</button><span>{isPlaying?"Preview playing":"Preview paused"}</span></div>
        {currentTrack.spotifyUrl&&<a href={currentTrack.spotifyUrl} target="_blank" rel="noreferrer" className="music-open-source">Open track ↗</a>}
        <button type="button" className="music-player-close" onClick={()=>{setIsPlaying(false);setCurrentTrack(null);}} aria-label="Close player">×</button>
      </aside>}
      <div className="music-back-link"><Link href="/">← Back to your dashboard</Link></div>
    </main>
  );
}
