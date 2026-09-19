"use client";

import { useRef, useState } from "react";
import { deleteMedia, uploadMedia, type MediaMetadata, type StorageCategory } from "../../../lib/storage";

type Props = {
  category?: StorageCategory;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  onComplete?: (media: MediaMetadata[]) => void;
};

type Item = { id: string; file: File; progress: number; state: "queued" | "uploading" | "ready" | "error"; error?: string; media?: MediaMetadata };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
}

export function MediaUploader({ category = "posts", multiple = true, accept = "image/*,video/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip", maxFiles = 8, onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files).slice(0, Math.max(0, maxFiles - items.length));
    if (!incoming.length) return;
    const next = incoming.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, progress: 0, state: "queued" as const }));
    setItems((current) => [...current, ...next]);
    void process(next);
  }

  async function process(next: Item[]) {
    const completed: MediaMetadata[] = [];
    for (const item of next) {
      setItems((current) => current.map((x) => x.id === item.id ? { ...x, state: "uploading" } : x));
      try {
        const media = await uploadMedia(item.file, category, (progress) => {
          setItems((current) => current.map((x) => x.id === item.id ? { ...x, progress: progress.percent } : x));
        });
        completed.push(media);
        setItems((current) => current.map((x) => x.id === item.id ? { ...x, state: "ready", progress: 100, media } : x));
      } catch (error) {
        setItems((current) => current.map((x) => x.id === item.id ? { ...x, state: "error", error: error instanceof Error ? error.message : "Upload failed." } : x));
      }
    }
    if (completed.length) onComplete?.(completed);
  }

  function retry(item: Item) { void process([{ ...item, state: "queued", progress: 0, error: undefined }]); }

  async function remove(item: Item) {
    if (item.media) {
      try { await deleteMedia(item.media); }
      catch { return; }
    }
    setItems((current) => current.filter((x) => x.id !== item.id));
  }

  return <div className="storage-uploader">
    <button
      type="button"
      className={`storage-drop ${dragging ? "is-dragging" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
    >
      <span className="storage-icon">↑</span>
      <strong>Add {category === "study-materials" ? "study material" : "media"}</strong>
      <small>Images, videos, PDF, documents & ZIP · secure upload · optimized delivery</small>
    </button>
    <input ref={inputRef} hidden type="file" accept={accept} multiple={multiple} onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ""; }} />

    {!!items.length && <div className="storage-list">
      {items.map((item) => <div className="storage-item" key={item.id}>
        <div className="storage-file-icon">{item.file.type.startsWith("image/") ? "IMG" : item.file.type.startsWith("video/") ? "VID" : "DOC"}</div>
        <div className="storage-info"><strong>{item.file.name}</strong><small>{formatSize(item.file.size)} · {item.state === "uploading" ? `Uploading ${item.progress}%` : item.state === "ready" ? "Uploaded" : item.state === "error" ? item.error : "Waiting"}</small>{item.state === "uploading" && <div className="storage-progress"><span style={{ width: `${item.progress}%` }} /></div>}</div>
        <div className="storage-controls">{item.state === "error" && <button type="button" onClick={() => retry(item)}>Retry</button>}<button type="button" onClick={() => void remove(item)} aria-label={`Remove ${item.file.name}`}>×</button></div>
      </div>)}
    </div>}
    <style jsx>{`.storage-uploader{width:100%}.storage-drop{width:100%;border:1px dashed #c8d0e2;background:linear-gradient(135deg,#f8f9ff,#fbf5ff);border-radius:14px;padding:20px 14px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;transition:transform .2s ease,border-color .2s ease,background .2s ease}.storage-drop:hover,.storage-drop.is-dragging{transform:translateY(-1px);border-color:#87929d;background:#f4f7f9}.storage-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#596cff,#a04de8);color:#fff;box-shadow:0 8px 18px #6d63e52b;display:grid;place-items:center;font-weight:900;font-size:17px;margin-bottom:3px}.storage-drop strong{font-size:12px}.storage-drop small{font-size:9px;color:#87919b;text-align:center}.storage-list{display:grid;gap:7px;margin-top:9px}.storage-item{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid #e0e5ef;background:#ffffffd9;border-radius:11px}.storage-file-icon{width:34px;height:34px;border-radius:9px;background:#eef0ff;display:grid;place-items:center;font-size:7px;font-weight:900}.storage-info{min-width:0;flex:1}.storage-info strong,.storage-info small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.storage-info strong{font-size:10px}.storage-info small{font-size:8px;color:#8a949e;margin-top:3px}.storage-progress{height:3px;background:#e9edf0;border-radius:99px;overflow:hidden;margin-top:6px}.storage-progress span{display:block;height:100%;background:linear-gradient(90deg,#596cff,#a04de8);border-radius:99px;transition:width .2s ease}.storage-controls{display:flex;align-items:center;gap:5px}.storage-controls button{border:0;background:none;font-size:9px;font-weight:800;color:#68737d;cursor:pointer;padding:5px}.storage-controls button:last-child{font-size:17px;padding:2px 5px}`}</style>
  </div>;
}
