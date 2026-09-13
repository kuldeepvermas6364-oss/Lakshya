"use client";

import { useEffect, useState } from "react";
import { deleteMedia, listMyMedia, type MediaMetadata } from "../../lib/storage";
import { MediaGallery } from "../components/storage/media-gallery";
import { MediaUploader } from "../components/storage/media-uploader";

export default function StoragePage() {
  const [media, setMedia] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function refresh() {
    setLoading(true);
    try { setMedia(await listMyMedia()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not load your media."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function remove(item: MediaMetadata) {
    try { await deleteMedia(item); setMedia((current) => current.filter((x) => x.id !== item.id)); setMessage("Media deleted."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete media."); }
  }

  return <main className="storage-page">
    <header><a href="/">← Dashboard</a><p>LAKSHYA STORAGE</p><h1>Your media library.</h1><span>Secure uploads, optimized media and simple cleanup in one place.</span></header>
    <section className="card"><h2>Upload media</h2><MediaUploader category="posts" multiple maxFiles={8} onComplete={(items) => { setMedia((current) => [...items, ...current]); setMessage(`${items.length} file${items.length === 1 ? "" : "s"} uploaded successfully.`); }} /></section>
    <section className="card"><div className="section-head"><div><p>LIBRARY</p><h2>My files</h2></div><button onClick={() => void refresh()}>Refresh</button></div>{loading ? <div className="empty">Loading your media…</div> : media.length ? <><MediaGallery media={media} /><div className="file-list">{media.map((item) => <div className="file-row" key={item.id}><div><strong>{item.fileName}</strong><small>{item.resourceType} · {Math.ceil(item.fileSize / 1024)} KB</small></div><button onClick={() => void remove(item)}>Delete</button></div>)}</div></> : <div className="empty">No uploads yet. Add your first file above.</div>}{message && <p className="message">{message}</p>}</section>
    <style jsx>{`.storage-page{max-width:920px;margin:auto;padding:28px 18px 70px;color:#18212b}.storage-page header{margin-bottom:18px}.storage-page header>a{color:#77828c;text-decoration:none;font-size:11px;font-weight:800}.storage-page header p,.section-head p{font-size:8px;letter-spacing:.16em;font-weight:900;color:#929ba4;margin:18px 0 6px}.storage-page h1{font-size:32px;letter-spacing:-.04em;margin:0}.storage-page header span{display:block;color:#7c8791;font-size:11px;margin-top:7px}.card{background:#fff;border:1px solid #e6eaed;border-radius:15px;padding:16px;margin-top:12px;box-shadow:0 8px 30px rgba(24,33,43,.05)}.card h2{font-size:15px;margin:0 0 12px}.section-head{display:flex;justify-content:space-between;align-items:center}.section-head p{margin:0 0 5px}.section-head h2{margin:0}.section-head button,.file-row button{border:0;background:#eef1f3;color:#18212b;border-radius:8px;padding:8px 10px;font-size:9px;font-weight:900;cursor:pointer}.empty{text-align:center;padding:35px 10px;color:#89939d;font-size:11px}.file-list{display:grid;gap:7px;margin-top:12px}.file-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #eef0f2;padding-top:8px}.file-row strong,.file-row small{display:block}.file-row strong{font-size:10px;max-width:65vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.file-row small{font-size:8px;color:#8a949e;margin-top:3px}.file-row button{background:none;color:#8a4d4d}.message{margin:10px 0 0;font-size:9px;color:#66717b}@media(max-width:600px){.storage-page{padding:20px 12px 50px}.storage-page h1{font-size:27px}}`}</style>
  </main>;
}
