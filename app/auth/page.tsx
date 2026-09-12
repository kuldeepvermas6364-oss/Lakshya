import { Suspense } from "react";
import AuthScreen from "./auth-screen";

function AuthFallback() {
  return <main className="auth-splash"><div className="auth-orbit"><img src="/lakshya-mark.svg" alt="Lakshya" /></div><b>Opening Lakshya…</b><span>Please wait a moment.</span></main>;
}

export default function AuthPage() {
  return <Suspense fallback={<AuthFallback />}><AuthScreen mode="login" /></Suspense>;
}
