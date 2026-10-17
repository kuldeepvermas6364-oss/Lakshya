# Lakshya Firebase Data Model

## Core collections

### `users/{uid}`
- `uid`, `displayName`, `photoURL`
- `email` (private; do not expose in public profile queries)
- `role`: `student | moderator | admin`
- `bio`, `classLevel`, `board`, `examTarget`
- `createdAt`, `updatedAt`, `lastSeen`, `isOnline`
- `privacy`: profile / friend-request / message preferences

### `friendRequests/{requestId}`
- `fromUid`, `toUid`, `status`: `pending | accepted | rejected`
- `createdAt`, `updatedAt`

### `friendships/{friendshipId}`
- `memberIds`: sorted two-element array
- `createdAt`, `updatedAt`

### `conversations/{conversationId}`
- `type`: `direct | group`
- `memberIds`
- `createdAt`, `updatedAt`, `lastMessageAt`
- `lastMessagePreview` (sanitized, no secrets)

### `conversations/{conversationId}/messages/{messageId}`
- `senderId`, `text`, `createdAt`
- optional `attachmentUrl`, `attachmentType`
- `deletedAt` for moderation-safe deletion

### `posts/{postId}`
- `authorId`, `body`, `tags`
- `createdAt`, `updatedAt`
- `likeCount`, `replyCount`, `status`: `visible | hidden | removed`

### `posts/{postId}/comments/{commentId}`
- `authorId`, `body`, `createdAt`, `updatedAt`
- `status`: `visible | hidden | removed`

### `reports/{reportId}`
- `reporterId`, `targetType`, `targetId`
- `reason`, `details`, `createdAt`, `status`
- Only moderators/admins can review moderation queues.

### `blocks/{blockId}`
- `ownerId`, `blockedUid`, `createdAt`

### `notifications/{notificationId}`
- `recipientId`, `type`, `actorId`, `targetId`
- `read`, `createdAt`

## Security principles
1. A user may edit only their own private profile fields.
2. Public profile queries must not expose private contact information.
3. Direct messages are readable/writable only by conversation members.
4. Friend requests can only be created for the requesting user's identity and updated by the participants.
5. Community posts/comments must enforce authenticated authorship.
6. Reports and blocks are private to the relevant users/moderators.
7. Client apps never receive server-only API keys.
8. Rate limiting and abuse detection should be added through trusted server-side code before production launch.
9. Calling should be limited to approved friend/group contexts rather than arbitrary public users.

## Planned indexes
- conversations: `memberIds ARRAY_CONTAINS + lastMessageAt DESC`
- messages: `createdAt ASC`
- posts: `status + createdAt DESC`
- notifications: `recipientId + read + createdAt DESC`
- friendRequests: `toUid + status + createdAt DESC`
