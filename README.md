# Lakshya

Lakshya is an India-focused study platform for Classes 6–12, JEE and NEET. It includes a responsive Next.js app with study and practice tools, AI endpoints, focus and planning features, notes, analytics, community, profiles and media storage.

## Local development

1. Install Node.js 20 or newer and pnpm.
2. Copy `.env.example` to `.env.local` and set the Firebase client configuration.
3. Add only the provider credentials needed for the features you want to enable. Keep server credentials out of `NEXT_PUBLIC_*` variables.
4. Run `pnpm install`, then `pnpm dev`.

Without Firebase configuration, the app can render in guest mode, but authentication and cloud-backed features are unavailable. AI, signed Cloudinary uploads and LiveKit calling also require their corresponding server-side environment variables; the app must not imply those services are active when they are not configured.

## Firebase security

Deploy the included Realtime Database rules and Firestore rules to the Firebase project. Review the rules against any schema changes before deploying. Firebase client configuration is public application configuration, not a substitute for database security rules.

## Deployment

Deploy the app through the Vercel project connected to the repository. Configure the required environment variables in Vercel and redeploy after changing them. Never commit `.env.local` or provider secret values.
