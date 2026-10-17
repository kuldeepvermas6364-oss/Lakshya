"use client";

import { useEffect, useRef, useState } from "react";

const FOCUS_SECONDS = 25 * 60;
const FOCUS_PATH = "focusSessions";

type FocusSession = {
  seconds: number;
  running: boolean;
  updatedAt: number;
};

export default function FocusPage() {
  const [seconds, setSeconds] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const sessionKeyRef = useRef<string>("");
  const syncingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const connectRealtime = async () => {
      try {
        const [{ onValue, ref, set }, firebaseModule, authModule] = await Promise.all([
          import("firebase/database"),
          import("@/lib/firebase"),
          import("firebase/auth"),
        ]);

        if (cancelled || !firebaseModule.realtimeDb) return;

        const authInstance = firebaseModule.auth;
        const user = authInstance ? authInstance.currentUser : null;
        if (!user) {
          setFirebaseReady(true);
          return;
        }

        sessionKeyRef.current = `${user.uid}/focus`;
        const sessionRef = ref(firebaseModule.realtimeDb, `${FOCUS_PATH}/${sessionKeyRef.current}`);

        unsubscribe = onValue(
          sessionRef,
          (snapshot) => {
            if (cancelled || syncingRef.current) return;
            const data = snapshot.val() as FocusSession | null;
            if (!data) return;
            if (typeof data.seconds === "number") setSeconds(Math.max(0, data.seconds));
            if (typeof data.running === "boolean") setRunning(data.running);
          },
          () => {
            // Realtime Database is optional for the timer; keep Focus Mode usable offline.
          },
        );

        setFirebaseReady(true);

        // Refresh the auth state once in case the user signs in just after the page mounts.
        authModule.onAuthStateChanged(authInstance, (signedInUser) => {
          if (!signedInUser || cancelled || sessionKeyRef.current) return;
          sessionKeyRef.current = `${signedInUser.uid}/focus`;
          onValue(
            ref(firebaseModule.realtimeDb, `${FOCUS_PATH}/${sessionKeyRef.current}`),
            (snapshot) => {
              const data = snapshot.val() as FocusSession | null;
              if (!data || cancelled || syncingRef.current) return;
              if (typeof data.seconds === "number") setSeconds(Math.max(0, data.seconds));
              if (typeof data.running === "boolean") setRunning(data.running);
            },
          );
        });

        void set;
      } catch {
        // Firebase being unavailable must never break Focus Mode.
        if (!cancelled) setFirebaseReady(false);
      }
    };

    void connectRealtime();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return FOCUS_SECONDS;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!firebaseReady || !sessionKeyRef.current) return;
    let cancelled = false;
    const sync = async () => {
      try {
        const { ref, set } = await import("firebase/database");
        const { realtimeDb } = await import("@/lib/firebase");
        if (!realtimeDb || cancelled) return;
        syncingRef.current = true;
        await set(ref(realtimeDb, `${FOCUS_PATH}/${sessionKeyRef.current}`), {
          seconds,
          running,
          updatedAt: Date.now(),
        } satisfies FocusSession);
        window.setTimeout(() => {
          syncingRef.current = false;
        }, 50);
      } catch {
        syncingRef.current = false;
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [seconds, running, firebaseReady]);

  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  const updateFocusState = (nextRunning: boolean, nextSeconds = seconds) => {
    setRunning(nextRunning);
    setSeconds(nextSeconds);
  };

  return (
    <main className="page">
      <div className="hero-row">
        <div>
          <p className="eyebrow">DEEP WORK</p>
          <h1>Focus Mode</h1>
          <p className="muted">Choose one task. Remove distractions. Make progress.</p>
        </div>
      </div>
      <section className="panel focus-panel" style={{ maxWidth: 700, margin: "0 auto", minHeight: 520 }}>
        <div className="panel-head">
          <div>
            <p className="eyebrow">CURRENT TASK</p>
            <h2>Physics — Electrostatics</h2>
          </div>
          <span className="live-dot">● {running ? "FOCUSING" : "READY"}</span>
        </div>
        <div className="timer">
          <div className="timer-circle">
            <span>{m}:{s}</span>
            <small>FOCUS</small>
          </div>
        </div>
        <div className="timer-controls">
          <button className="primary" onClick={() => updateFocusState(!running)}>
            {running ? "Pause" : "Start focus"}
          </button>
          <button className="secondary" onClick={() => updateFocusState(false, FOCUS_SECONDS)}>
            Reset
          </button>
        </div>
        <p className="muted center">25 minutes focus · 5 minutes break · repeat</p>
      </section>
    </main>
  );
}
