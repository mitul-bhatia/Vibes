# Project Context For Diagram Generation

## System Summary

- Name: Flately
- Purpose: Flatmate discovery platform that ranks roommate candidates by compatibility and enables match-based chat.
- Core users: Guests, authenticated users (seekers and room owners), support/admin operators.

## Components

- Frontend: React 19 + TypeScript + Redux Toolkit + React Router + Tailwind.
- Backend: Express 5 + TypeScript + JWT auth + Google OAuth + Socket.IO.
- Data stores: MongoDB Atlas via Prisma ORM.
- External integrations: Google OAuth, Cloudinary signed uploads.

## Domain Entities

- Entity list: User, Profile, Preference, Swipe, Match, Conversation, Message.
- Key relationships:
  - User 1:1 Profile
  - User 1:1 Preference
  - Swipe links fromUser -> toUser with unique pair
  - Match stores canonical userA/userB pair
  - Match 1:1 Conversation
  - Conversation 1:N Message

## Primary Workflows

- Main flow:
  - Landing -> questionnaire (optional) -> signup/login/google -> profile bootstrap -> onboarding gate -> dashboard -> discovery/matches/chat.
- Alternative flows:
  - Returning authenticated user with completed onboarding goes directly to /app.
  - Google OAuth callback exchanges one-time code for standard JWT session.
- Failure flows:
  - Invalid credentials/auth failure on login/signup.
  - Session expiration triggers redirect to login with reason.
  - Incomplete onboarding returns 403 for discovery/matches endpoints.
  - Profile/bootstrap/load failures show retry state.

## API and Events

- APIs:
  - Auth: /auth/signup, /auth/login, /auth/google/start, /auth/google/callback, /auth/google/exchange
  - Profile/Preference: /profiles/me, /preferences/me
  - Discovery/Matching: /discovery/feed, /discovery/swipe, /matching/me, /matches/me
  - Chat: /chat/:matchId
  - Uploads: /uploads/signature
- Event producers/consumers:
  - Socket.IO events for joinRoom, sendMessage, message/new_message delivery.

## Constraints

- Security: JWT bearer auth, helmet, CORS allowlist, rate limit, no hardcoded secrets.
- Compliance: Input validation and authenticated access control for protected routes.
- Performance: Batched DB reads in discovery/matches enrichment, deterministic ranking order for tie scores.

## Mermaid Quality Directives

- Preferred directions:
  - class/object/use-case: LR
  - activity/sequence: TD-like narrative flow with clear progression
- Mandatory groupings:
  - Frontend, API, Domain Services, Persistence, External Integrations
- Minimum depth targets:
  - class/object/use-case: 6+ nodes each
  - activity/sequence: 8+ transitions each
- Naming consistency:
  - Use domain terms already present in entities and endpoints above.
