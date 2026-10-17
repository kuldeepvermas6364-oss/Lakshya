# Lakshya — Product Architecture

## Core layers

1. **Experience** — Next.js App Router, responsive UI, PWA.
2. **Study engine** — subjects, chapters, planner, focus sessions, practice and analytics.
3. **Social layer** — community, friends, realtime messaging, study groups.
4. **AI layer** — doubt help, quiz generation, revision and performance insights.
5. **Backend** — Firebase Auth + Firestore realtime; server-side APIs for privileged operations.
6. **Media** — Cloudinary for user-uploaded images/documents where configured.
7. **Calls** — third-party voice/video provider, restricted to approved friend relationships.
8. **Operations** — moderation, reports, admin tools, security rules, observability and CI.

## Firestore collections

- `users/{uid}` — profile, education preferences, privacy settings.
- `users/{uid}/studySessions/{sessionId}` — focused study sessions.
- `users/{uid}/plannerTasks/{taskId}` — personal study tasks.
- `users/{uid}/chapterProgress/{chapterId}` — chapter progress.
- `friendRequests/{requestId}` — pending/accepted/rejected requests.
- `friendships/{friendshipId}` — normalized friend relationship.
- `conversations/{conversationId}` — 1-to-1/group conversation metadata.
- `conversations/{conversationId}/messages/{messageId}` — realtime messages.
- `posts/{postId}` — community posts.
- `posts/{postId}/comments/{commentId}` — threaded discussion.
- `reports/{reportId}` — safety/moderation reports.
- `blocks/{blockId}` — user blocking relationships.
- `notifications/{notificationId}` — user notifications.

## Privacy and safety

- Never place API secrets in client code or GitHub.
- Friend-only calling; no random public calling directory.
- Block/mute/report controls should be available wherever users interact.
- Avoid exposing phone numbers, addresses or other sensitive contact details.
- Validate and authorize every Firebase write using security rules and server-side checks where appropriate.
- Add rate limits/anti-spam controls before production launch.

## Credential boundary

The repository can contain integration code and `.env.example`, but real Firebase, Cloudinary, AI and calling credentials must be configured through the deployment environment. The app should remain buildable without committing secrets.
