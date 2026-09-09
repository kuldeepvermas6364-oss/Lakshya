import { collection, doc, onSnapshot, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export type DashboardStats = {
  studySecondsToday?: number;
  questionsSolved?: number;
  currentStreak?: number;
  bestStreak?: number;
  dailyGoalMinutes?: number;
};

export type PlannerItem = {
  id: string;
  title: string;
  subjectId?: string;
  date: string;
  durationMinutes: number;
  completed?: boolean;
};

export function subscribeToDashboard(uid: string, onData: (data: DashboardStats | null) => void, onError?: (e: Error) => void) {
  return onSnapshot(doc(db, "users", uid), snap => onData(snap.exists() ? (snap.data().stats as DashboardStats | undefined) ?? {} : null), onError);
}

export function subscribeToPlanner(uid: string, date: string, onData: (items: PlannerItem[]) => void, onError?: (e: Error) => void) {
  const q = query(collection(db, "users", uid, "plannerTasks"), orderBy("date", "asc"), limit(100));
  return onSnapshot(q, snap => onData(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PlannerItem, "id">) })).filter(x => x.date === date)), onError);
}

export async function getStudyTotals(uid: string, since: Date) {
  const snap = await getDocs(query(collection(db, "users", uid, "studySessions"), orderBy("createdAt", "desc"), limit(200)));
  let seconds = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const created = data.createdAt as Timestamp | undefined;
    if (created?.toDate && created.toDate() >= since) seconds += Math.max(0, Number(data.minutes) || 0) * 60;
  }
  return seconds;
}
