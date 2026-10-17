import { get, onValue, ref } from "firebase/database";
import { realtimeDb } from "./firebase";

export type DashboardStats = { studySecondsToday?: number; questionsSolved?: number; currentStreak?: number; bestStreak?: number; dailyGoalMinutes?: number; progressPercent?: number };
export type PlannerItem = { id: string; title: string; subjectId?: string; date: string; time?: string; durationMinutes: number; completed?: boolean };

export function subscribeToDashboard(uid: string, onData: (data: DashboardStats | null) => void, onError?: (e: Error) => void) {
  return onValue(ref(realtimeDb, `users/${uid}/stats`), (snap) => onData(snap.exists() ? snap.val() as DashboardStats : null), onError);
}

export function subscribeToPlanner(uid: string, date: string, onData: (items: PlannerItem[]) => void, onError?: (e: Error) => void) {
  return onValue(ref(realtimeDb, `users/${uid}/plannerTasks`), (snap) => {
    const data = snap.exists() ? snap.val() as Record<string, Omit<PlannerItem, "id">> : {};
    const items = Object.entries(data).map(([id, item]) => ({ id, ...item })).filter((item) => item.date === date).sort((a, b) => `${a.date} ${a.time ?? ""}`.localeCompare(`${b.date} ${b.time ?? ""}`)).slice(0, 100);
    onData(items);
  }, onError);
}

export async function getStudyTotals(uid: string, since: Date) {
  const snap = await get(ref(realtimeDb, `users/${uid}/studySessions`));
  if (!snap.exists()) return 0;
  const data = snap.val() as Record<string, { createdAt?: number; minutes?: number }>;
  return Object.values(data).filter((item) => Number(item.createdAt ?? 0) >= since.getTime()).reduce((total, item) => total + Math.max(0, Number(item.minutes) || 0) * 60, 0);
}

export async function getPracticeCount(uid: string, since: Date) {
  const snap = await get(ref(realtimeDb, `users/${uid}/practiceAttempts`));
  if (!snap.exists()) return 0;
  const data = snap.val() as Record<string, { createdAt?: number }>;
  return Object.values(data).filter((item) => Number(item.createdAt ?? 0) >= since.getTime()).length;
}
