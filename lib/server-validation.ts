import { validateComment, validateEmail, validateMessage, validateNoteContent, validateNoteTitle, validatePost, validateStudyDuration, validateUsername } from "./validation";

export type PayloadError = { ok: false; error: string };
export type PayloadSuccess<T> = { ok: true; value: T };
export type PayloadResult<T> = PayloadError | PayloadSuccess<T>;

export function requireRecord(payload: unknown): PayloadResult<Record<string, unknown>> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid request payload." };
  }
  return { ok: true, value: payload as Record<string, unknown> };
}

export function validatePayloadField<T extends string | number>(
  result: { ok: true; value: T } | { ok: false; error: string },
): PayloadResult<T> {
  return result.ok ? result : { ok: false, error: result.error };
}

export const serverValidators = {
  email: validateEmail,
  username: validateUsername,
  post: validatePost,
  comment: validateComment,
  message: validateMessage,
  noteTitle: validateNoteTitle,
  noteContent: validateNoteContent,
  studyDuration: validateStudyDuration,
} as const;

export function badRequest(error: string) {
  return { ok: false as const, error };
}

export function validateRequiredString(payload: Record<string, unknown>, key: string, label = key): PayloadResult<string> {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) return badRequest(`${label} is required.`);
  return { ok: true, value: value.trim() };
}

export function validateUserOwnedPayload(payload: unknown, uid: string): PayloadResult<Record<string, unknown>> {
  const result = requireRecord(payload);
  if (!result.ok) return result;
  if (!uid) return badRequest("Authentication is required.");
  if (typeof result.value.userId === "string" && result.value.userId !== uid) {
    return badRequest("You cannot modify another user's data.");
  }
  return result;
}
