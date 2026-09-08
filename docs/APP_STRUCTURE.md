# Lakshya — App Structure

Lakshya is organized as an India-first study + productivity + student community platform. The structure below is the product source of truth for future implementation.

## 1. Primary navigation

### Learn
- Dashboard `/`
- Subjects `/subjects`
- Chapters `/subjects/[subjectId]/[chapterId]`
- Practice `/practice`
- Notes `/notes`

### Plan & Focus
- Study Planner `/planner`
- Focus Mode `/focus`
- Goals `/goals`
- Revision `/revision`

### Progress
- Analytics `/analytics`
- Achievements `/achievements`

### Community
- Community `/community`
- Topic spaces `/community/spaces/[spaceId]`
- Post `/community/posts/[postId]`
- Friends `/friends`
- Messages `/messages`
- Conversation `/messages/[conversationId]`
- Study groups `/groups`
- Notifications `/notifications`

### Account
- Profile `/profile`
- Settings `/settings`

## 2. Authentication

- `/auth` — sign in / register
- Firebase Authentication owns identity.
- User profile is stored in `users/{uid}`.
- Protected student features must verify the Firebase auth state before reading or writing private data.
- No Firebase, Cloudinary, AI, or calling secrets are committed to GitHub.

## 3. Study engine

The study engine is the core of Lakshya:

`Board → Class → Exam Goal → Subject → Chapter → Topic → Learning Material → Practice → Revision → Progress`

Initial curriculum should support NCERT/CBSE and be extensible to UP Board and other Indian boards. JEE/NEET preparation is represented as an exam layer rather than a separate app.

## 4. Dashboard

The dashboard should surface only useful daily information:
- Today's study progress
- Planned sessions
- Continue learning
- Weak chapters
- Practice recommendation
- Focus timer
- Current streak
- Upcoming tasks
- Community activity

## 5. Subjects and chapters

Subject pages should provide:
- syllabus progress
- chapter list
- chapter status: not started / learning / revision / completed
- topic list
- notes and saved material
- practice entry
- revision entry
- chapter analytics

## 6. Practice system

Question model:
- subject
- chapter
- topic
- exam/board
- difficulty
- question type
- options
- correct answer
- explanation
- source/reference

Student attempt model:
- uid
- questionId
- selectedAnswer
- correct
- timeTaken
- createdAt

The UI should support practice sets, timed quizzes, chapter tests, mixed tests, review of mistakes, and revision from incorrect answers.

## 7. Planner + Focus

Planner stores study tasks and sessions in Firestore. Focus Mode can create a study-session record when a user completes a session. The timer remains usable locally even if network connectivity is temporarily unavailable.

## 8. Notes and media

Notes support:
- text notes
- images
- PDF references/uploads
- tags
- subject/chapter linking
- bookmarks
- search

Cloudinary is the planned media layer. Upload credentials and signing secrets stay server-side/environment-only.

## 9. Community

Community is a moderated learning discussion area:
- posts
- replies/threads
- topic spaces
- reactions
- bookmarks
- reports
- block/mute
- moderation states

Students should not need to expose phone numbers, addresses, passwords, OTPs, or other private contact information to participate.

## 10. Friends + realtime chat

Friendship model:
`request → accepted friendship → conversation`

Messages use Firestore realtime listeners. Conversation documents contain membership metadata; messages are stored below the conversation.

Planned collections:
- `friendRequests`
- `friendships`
- `conversations`
- `conversations/{conversationId}/messages`
- `blocks`
- `notifications`

Calling is friend-only by default and must respect block/privacy state.

## 11. AI layer

AI is a separate service boundary and must not expose provider keys to the browser.

Features:
- AI Study Assistant
- doubt explanation
- step-by-step numerical guidance
- AI Quiz Generator
- AI Notes summarization
- revision generation
- weak-topic recommendations
- personalized study planning

Educational answers should prefer user-provided/source-grounded context and clearly indicate uncertainty instead of inventing facts.

## 12. Admin

Admin routes are separate from student navigation:
- dashboard
- users
- curriculum
- questions
- notes/materials
- community moderation
- reports
- AI/content controls
- analytics

Admin authorization must be enforced server-side; hiding an admin link is not security.

## 13. Code organization

```text
app/
  auth/
  analytics/
  community/
  focus/
  friends/
  messages/
  notes/
  planner/
  practice/
  profile/
  settings/
  subjects/
  api/                 # secure server endpoints as features require them

components/            # reusable UI components
lib/
  firebase.ts          # Firebase client initialization
  auth.ts              # authentication operations
  chat.ts              # realtime conversation helpers
  firestore.ts         # Firestore helpers
  study-data.ts        # curriculum/domain types and seed data
  study-storage.ts     # study persistence
  cloudinary.ts         # media helpers

public/
docs/
  APP_STRUCTURE.md
  LAKSHYA_ARCHITECTURE.md
  FIREBASE_DATA_MODEL.md
firestore.rules
```

## 14. Implementation order

1. Shared shell + responsive navigation
2. Firebase auth + profile
3. Curriculum/subjects/chapters
4. Planner + focus persistence
5. Notes/media
6. Practice engine
7. Analytics/goals/revision
8. Community + moderation
9. Friends + realtime chat
10. Calls
11. AI features
12. Admin + security review + tests + PWA/Android packaging

Every stage must keep the production build green before moving to the next stage.
