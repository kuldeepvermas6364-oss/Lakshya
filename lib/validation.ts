export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/;

function text(value: unknown, min: number, max: number, label: string): ValidationResult {
  if (typeof value !== "string") return { ok: false, error: `${label} is required.` };
  const normalized = value.trim();
  if (normalized.length < min) return { ok: false, error: `${label} is too short.` };
  if (normalized.length > max) return { ok: false, error: `${label} is too long.` };
  return { ok: true, value: normalized };
}

export const validateEmail = (value: unknown): ValidationResult => {
  const result = text(value, 3, 254, "Email");
  if (!result.ok) return result;
  return EMAIL_RE.test(result.value)
    ? result
    : { ok: false, error: "Enter a valid email address." };
};

export const validateUsername = (value: unknown): ValidationResult => {
  const result = text(value, 3, 30, "Username");
  if (!result.ok) return result;
  return USERNAME_RE.test(result.value)
    ? result
    : { ok: false, error: "Username may contain letters, numbers, dots, underscores and hyphens only." };
};

export const validatePost = (value: unknown) => text(value, 1, 5000, "Post");
export const validateComment = (value: unknown) => text(value, 1, 1000, "Comment");
export const validateMessage = (value: unknown) => text(value, 1, 4000, "Message");
export const validateNoteTitle = (value: unknown) => text(value, 1, 160, "Note title");
export const validateNoteContent = (value: unknown) => text(value, 1, 50000, "Note content");

export function validateStudyDuration(value: unknown):
  | { ok: true; value: number }
  | { ok: false; error: string } {
  const duration = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(duration)) return { ok: false, error: "Study duration must be a number." };
  if (!Number.isInteger(duration) || duration < 1 || duration > 24 * 60 * 60) {
    return { ok: false, error: "Study duration must be between 1 second and 24 hours." };
  }
  return { ok: true, value: duration };
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File | null | undefined):
  | { ok: true; value: File }
  | { ok: false; error: string } {
  if (!file) return { ok: false, error: "Select an image first." };
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only JPG, PNG or WebP images are supported." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  return { ok: true, value: file };
}
