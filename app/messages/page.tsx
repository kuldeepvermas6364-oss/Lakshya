import Link from "next/link";

export default function MessagesPage() {
  return <main className="messages-page"><header className="simple-head"><div><p className="eyebrow">PRIVATE STUDY CHAT</p><h1>Messages</h1></div><Link className="secondary" href="/friends">Find friends</Link></header><section className="panel"><h2>Start a real conversation</h2><p className="muted">Your messages will appear here when you open a chat with a connected friend.</p><Link className="primary" href="/friends">Browse friends</Link></section></main>;
}
