# Lakshya — Phase 07: Analytics, Goals, Streaks & Smart Reminders

Status: COMPLETE

## Delivered
- Analytics now reads the authenticated student's Firestore study sessions, practice attempts and planner tasks.
- Weekly study time is calculated from recorded study sessions.
- Practice count and accuracy are calculated from saved attempts.
- Planner completion percentage is calculated from saved planner tasks.
- Current streak is calculated from actual study/practice activity dates.
- Subject health is calculated from practice accuracy for Physics, Chemistry and Mathematics.
- Smart reminders surface useful next actions based on sign-in state, streak, planner completion and practice accuracy.
- No hard-coded progress numbers remain on the Analytics screen.

## Data sources
- `users/{uid}/studySessions`
- `users/{uid}/practiceAttempts`
- `users/{uid}/plannerTasks`

## Phase boundary
This phase intentionally focuses on progress intelligence and the analytics experience. Admin/content management and offline/PWA/Android packaging remain later roadmap work.
