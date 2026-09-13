"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuth, getUserProfile } from "./auth";

interface AuthContextValue {
  user: User | null;
  profile: Record<string, unknown> | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToAuth(async (nextUser) => {
        if (!mounted) return;
        setUser(nextUser);
        if (!nextUser) {
          setProfile(null);
          setLoading(false);
          return;
        }
        try {
          const nextProfile = await getUserProfile(nextUser.uid);
          if (mounted) setProfile(nextProfile);
        } catch {
          if (mounted) setProfile(null);
        } finally {
          if (mounted) setLoading(false);
        }
      });
    } catch (error) {
      // Never let a browser-specific Firebase initialization/storage problem
      // crash the entire Lakshya client. Features can still render while auth
      // is unavailable, and the next action can surface its own friendly error.
      console.warn("Lakshya auth initialization skipped:", error);
      if (mounted) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => ({ user, profile, loading }), [user, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
