"use client";

import { useState } from "react";
import type { MediaMetadata } from "../../../lib/storage";
import { optimizeCloudinaryUrl } from "../../../lib/storage";

export function MediaGallery({ media }: { media: MediaMetadata[] }) {
  const [active, setActive] = useState<MediaMetadata | null>(null);
  if (!media.length) return null;
  return <>
    <div className="media-grid">
      {media.map((item) => <button className="media-tile" key={item.id} type="button" onClick={() => setActive(item)} aria-label={`Preview ${item.fileName}`}>
        {item.resourceType === "video" ? <video src={item.secureUrl} poster={item.thumbnailUrl} muted playsInline preload="metadata" /> : item.resourceType === "image" ? <img src={optimizeCloudinaryUrl(item.secureUrl, 700)} alt={item.fileName} loading="lazy" /> : <div className="doc-tile"><span>PDF</span><strong>{item.fileName}</strong></div>}
      </button>)}
    </div>
    {active && <div className="media-modal" role="dialog" aria-modal="true" aria-label="Media preview" onClick={() => setActive(null)}>
      <button className="media-close" type="button" onClick={() => setActive(null)} aria-label="Close preview">×</button>
      <div className="media-modal-content" onClick={(event) => event.stopPropagation()}>
        {active.resourceType === "video" ? <video src={active.secureUrl} poster={active.thumbnailUrl} controls playsInline /> : active.resourceType === "image" ? <img src={active.secureUrl} alt={active.fileName} /> : <a className="document-open" href={active.secureUrl} target="_blank" rel="noreferrer">Open {active.fileName}</a>}
      </div>
    </div>}
    <style jsx>{`.media-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:7px;margin-top:10px}.media-tile{border:0;padding:0;aspect-ratio:1/1;overflow:hidden;border-radius:11px;background:#eef1f3;cursor:pointer}.media-tile img,.media-tile video{width:100%;height:100%;object-fit:cover;display:block}.doc-tile{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;gap:6px}.doc-tile span{font-size:9px;font-weight:900;background:#18212b;color:#fff;border-radius:6px;padding:4px 6px}.doc-tile strong{font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:90%}.media-modal{position:fixed;inset:0;z-index:1000;background:rgba(7,12,17,.82);display:grid;place-items:center;padding:24px}.media-modal-content{max-width:min(92vw,1100px);max-height:88vh;display:grid;place-items:center}.media-modal-content img,.media-modal-content video{max-width:92vw;max-height:84vh;border-radius:12px}.document-open{background:#fff;color:#18212b;text-decoration:none;padding:14px 18px;border-radius:10px;font-size:12px;font-weight:800}.media-close{position:fixed;right:18px;top:14px;border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:50%;width:38px;height:38px;font-size:25px;cursor:pointer}`}</style>
  </>;
}
