import { ref, push, set, update, remove, get, query, orderByChild } from "firebase/database";
import { realtimeDb } from "./firebase";

const userPath = (uid: string) => `users/${uid}`;

type SavedQuizRecord = {
  id: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  language?: string;
  difficulty?: string;
  questions?: unknown[];
  durationMinutes?: number;
  createdAt?: number;
  savedAt?: number;
};

export async function saveStudySession(uid: string, subjectId: string, minutes: number) {
  if (!uid || minutes <= 0) throw new Error("Invalid study session");
  const item = push(ref(realtimeDb, `${userPath(uid)}/studySessions`));
  await set(item, { subjectId, minutes, createdAt: Date.now() });
  return item;
}

export async function savePracticeAttempt(uid: string, data: { subject: string; chapter: string; topic?: string; correct: boolean }) {
  if (!uid) throw new Error("Sign in required");
  const item = push(ref(realtimeDb, `${userPath(uid)}/practiceAttempts`));
  await set(item, { ...data, createdAt: Date.now() });
  return item;
}

export async function saveSavedQuiz(uid: string, quiz: { id: string; subject: string; chapter: string; topic: string; language: string; difficulty: string; questions: unknown[]; durationMinutes: number; createdAt: number }) {
  if (!uid || !quiz.id) throw new Error("Sign in required");
  const quizRef = ref(realtimeDb, `${userPath(uid)}/savedQuizzes/${quiz.id}`);
  await set(quizRef, { ...quiz, savedAt: Date.now() });
  return quizRef;
}

export async function listSavedQuizzes(uid: string): Promise<SavedQuizRecord[]> {
  if (!uid) throw new Error("Sign in required");
  const snap = await get(query(ref(realtimeDb, `${userPath(uid)}/savedQuizzes`), orderByChild("createdAt")));
  if (!snap.exists()) return [];

  const data = snap.val() as Record<string, Omit<SavedQuizRecord, "id">>;
  return Object.entries(data)
    .map(([id, item]) => ({ id, ...item }))
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
}

export async function savePlannerTask(uid: string, task: { title: string; subjectId?: string; date: string; time?: string; durationMinutes: number; completed?: boolean }) {
  if (!uid || !task.title.trim()) throw new Error("Invalid planner task");
  const item = push(ref(realtimeDb, `${userPath(uid)}/plannerTasks`));
  await set(item, { ...task, completed: Boolean(task.completed), createdAt: Date.now(), updatedAt: Date.now() });
  return item;
}

export async function updatePlannerTask(uid: string, taskId: string, data: { completed?: boolean; title?: string; subjectId?: string; date?: string; time?: string; durationMinutes?: number }) {
  if (!uid || !taskId) throw new Error("Invalid planner task");
  return update(ref(realtimeDb, `${userPath(uid)}/plannerTasks/${taskId}`), { ...data, updatedAt: Date.now() });
}

export async function deletePlannerTask(uid: string, taskId: string) {
  if (!uid || !taskId) throw new Error("Invalid planner task");
  return remove(ref(realtimeDb, `${userPath(uid)}/plannerTasks/${taskId}`));
}

export async function updateChapterProgress(uid: string, chapterId: string, progress: number) {
  const safe = Math.max(0, Math.min(100, Math.round(progress)));
  return set(ref(realtimeDb, `${userPath(uid)}/chapterProgress/${chapterId}`), { progress: safe, updatedAt: Date.now() });
}

export async function updateStudyProfile(uid: string, data: Record<string, unknown>) {
  return update(ref(realtimeDb, `${userPath(uid)}`), { ...data, updatedAt: Date.now() });
}


export async function saveStudyNote(uid: string, note: { title: string; content: string; subject?: string }) {
  if (!uid || !note.title.trim()) throw new Error("Invalid note");
  const item = push(ref(realtimeDb, `${userPath(uid)}/notes`));
  await set(item, { ...note, createdAt: Date.now(), updatedAt: Date.now() });
  return item;
}
