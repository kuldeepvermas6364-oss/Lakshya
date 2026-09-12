export function friendlyAuthError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";

  const messages: Record<string, string> = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/wrong-password": "Email or password is incorrect.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a little and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/user-disabled": "This account is currently disabled. Please contact support.",
    "auth/operation-not-allowed": "This sign-in method is not enabled yet.",
    "auth/requires-recent-login": "Please sign in again and retry this action.",
  };

  if (code && messages[code]) return messages[code];
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
