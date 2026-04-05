# CLAUDE.md — Flately Frontend Rebuild

> This file is the single source of truth for any agent building the Flately frontend.
> The backend is COMPLETE and must not be modified. Your entire job is the frontend.
> Read this fully before writing a single line of code.

---

## 0. Approved Overrides (2026-04-05)

These decisions supersede any conflicting statements below:

1. Frontend root is `flately-full_stack/frontend` (single-level), not `frontend/frontend`.
2. Auth0 is being removed via hard cutover.
3. Authentication target is first-party auth with:

- email/password
- Google OAuth

4. Backend changes are allowed only when explicitly approved by user for upgrade purposes.
5. No mock/demo data in production pages.
6. Unsupported routes remain hidden until backend support is implemented.

---

## 1. What Is Flately

Flately is an end-to-end flatmate-finding platform. It connects two types of users:

- **Room listers** — people who have a room and are looking for a compatible tenant.
- **Room seekers** — people looking for a room and a compatible flatmate.

Both types can discover each other. The matching is **bidirectional and compatibility-based** — it is not a classified ads board. Think Tinder for roommates, where the algorithm ranks people by lifestyle and preference compatibility before either party swipes.

The core value loop:

```
Sign up → Complete profile → Discover matches → Like/pass → Mutual like = Match → Chat
```

Everything in the frontend must serve this loop. There are no extraneous features in scope.

---

## 2. Tech Stack (Exact — Do Not Change Versions)

```
React              ^19.2.3
Vite               ^7.2.4
TypeScript         ^5.9.3
TailwindCSS        ^4.1.18   (uses @import "tailwindcss" + @theme directive — NOT v3)
Redux Toolkit      ^2.11.2
React Router DOM   ^6.28.0
Auth0 React SDK    ^2.11.0
Axios              ^1.13.2
Framer Motion      ^12.29.2
Socket.IO Client   ^4.8.3
React Hook Form    ^7.71.1
Zod                ^4.3.5    (v4 — NOT v3)
Radix UI           ^1.x
Lucide React       ^0.563.0
```

Project root: `frontend/frontend/`
Import alias: `@/` → `src/`

---

## 3. Design System

### Colors (defined in `src/index.css` via `@theme`)

```css
--color-primary: #166534 /* Forest green — buttons, accents, active states */
  --color-primary-dark: #14532d /* Hover states */ --color-mint: #f0fdf4
  /* Active/selected backgrounds */ --color-canvas: #fafafa
  /* Page background */ --color-surface: #ffffff /* Card/panel backgrounds */
  --color-neutral-border: #e5e7eb /* Borders, dividers */;
```

### Typography

- **Inter** (300–900): body, headings, labels
- **JetBrains Mono** (400–700): data values, scores, IDs, monospace tags
- **Material Symbols Outlined**: icons (via Google Fonts CDN)

### Aesthetic: "Command Center"

- Monospace for data/metrics (`font-mono`)
- Uppercase small-caps labels (`text-[10px] font-bold uppercase tracking-widest`)
- Green accent on white or light surfaces
- Compact data grids with border separators
- Mint-green for selected/active states
- Code-like labels where appropriate (e.g. `// STEP_02_HOUSING`)

### Layout

- Desktop-only for this build. No mobile breakpoints needed.
- App shell: fixed 256px sidebar + `min-w-0` content region (flex)
- Content pages: `p-6` outer padding, `max-w-[1100px]` desktop container

---

## 4. Complete User Flow

### 4.1 Auth Entry (Landing → Auth0 → Backend Sync)

1. User lands on `/` (public Landing page)
2. Clicks "Get Started Free" → `loginWithRedirect({ screen_hint: 'signup' })`
3. Auth0 handles the entire auth flow (OAuth, email/password, magic link)
4. Auth0 redirects back to `window.location.origin`
5. `AuthSync` component fires → `GET /users/me` (Bearer JWT)
   - Backend creates the User record if it doesn't exist yet
   - Stores `{ id, auth0id, email, name, picture }` in Redux `auth` slice
6. `AuthSync` also fires `GET /profiles/me` → stores result in Redux `profile` slice

### 4.2 Onboarding Gate (The Core Fix)

This is the broken piece that must be rebuilt correctly.

`ProtectedRoute` (wraps all `/app/*` routes) must check:

```typescript
if (!profile) → loading spinner (profile fetch in progress)
if (profile === null || !profile.onboardingCompleted) → navigate('/app/onboarding')
if (profile.onboardingCompleted) → render children (allow access to /app/*)
```

The profile is stored in Redux. `AuthSync` fetches it once on login and stores it. If `onboardingCompleted` is `false` or the profile is `null`, the user is always redirected to `/app/onboarding` regardless of which `/app/*` URL they try to access.

The onboarding route (`/app/onboarding`) is accessible without `onboardingCompleted === true`. Once the user completes onboarding, they're redirected to `/app` (dashboard).

### 4.3 Onboarding Wizard (6 Steps)

This is the heart of the user flow. Every field here feeds either `POST /profiles/me` or `POST /preferences/me` on final submit.

#### Step 1 — Identity (`// STEP_01_IDENTITY`)

**Profile fields collected:**

- `name` (string, required, min 2 chars)
- `age` (number, required, 18–99)
- `gender` (enum: `male | female | other | prefer-not-to-say`)
- `bio` (string, optional, max 500 chars)
- `occupation` (enum: `student | professional`)
- `photos[]` — Cloudinary upload (see Section 7)

**UI:** TileRadio for gender, text inputs for name/age/bio, Cloudinary upload widget for photo.

#### Step 2 — Housing Situation (`// STEP_02_HOUSING`)

**Profile fields collected:**

- `hasRoom` (boolean) — **This is an independent step with its own screen**
- `city` (string, required, min 2 chars)

**UI:** Two large tiles: "I have a room" / "I'm looking for a room". Text input for city.

`hasRoom` drives the "Has Room" discovery tag and is shown prominently on all profile cards. It is critical to collect this explicitly.

#### Step 3 — Budget (`// STEP_03_BUDGET`)

**Preference fields collected:**

- `minBudget` (number, min 0)
- `maxBudget` (number, must be ≥ minBudget)
- `city` (string — copied from Step 2, sent to preferences too)

**UI:** Two number inputs. Note: budget goes to `POST /preferences/me`, not profiles.

#### Step 4 — Lifestyle & Habits (`// STEP_04_LIFESTYLE`)

This step collects fields for **both** Profile and Preference. Send both on final submit.

**Profile fields:**

- `sleepSchedule` (enum: `early-bird | night-owl | flexible`)
- `noiseLevel` (number, 1–5)
- `guestPolicy` (enum: `never | rarely | sometimes | often`)
- `smoking` (enum: `no | outside | yes`)
- `pets` (enum: `no | have | love | allergic`)

**Preference fields (derived from lifestyle answers):**

- `smoking` (boolean) — map: `profile.smoking !== 'no'` → true
- `drinking` (boolean) — ask explicitly: "Do you drink?" Yes/No
- `pets` (boolean) — map: `profile.pets === 'have' || profile.pets === 'love'` → true
- `sleepSchedule` (1–5) — map: `early-bird → 1`, `flexible → 3`, `night-owl → 5`
- `cleanliness` (number, 1–5) — ask explicitly: "How clean are you?" slider
- `socialLevel` (number, 1–5) — ask explicitly: "How social are you?" slider

**UI:** TileRadio grids for enum fields, sliders for numeric fields (1–5), explicit Yes/No tiles for `drinking`.

#### Step 5 — What Matters Most (`// STEP_05_WEIGHTS`)

**Preference fields collected:**

- `genderPreference` (enum: `male | female | any`)
- `weightCleanliness` (number)
- `weightSleep` (number)
- `weightHabits` (number)
- `weightSocial` (number)
- All four weights **MUST sum to exactly 100** (backend validates this)

**How to handle weights in UI (rank-to-weight pattern):**
Do NOT show raw number inputs or percentage sliders. Users don't think in percentages.

Instead, show 4 priority tiles that the user **ranks by importance** using click-to-order:

```
[ Cleanliness ]  [ Sleep schedule ]  [ Habits (smoking/drinking) ]  [ Social life ]
   Click to rank 1st, 2nd, 3rd, 4th
```

Map rank → weight automatically:

```typescript
const RANK_WEIGHTS = [40, 30, 20, 10]; // must sum to 100
// rank[0] (most important) gets 40, rank[1] gets 30, etc.
```

This ensures weights always sum to 100 while giving users an intuitive "what matters most" UI.

**UI:** 4 draggable/clickable tiles for ranking. Gender preference TileRadio.

#### Step 6 — Review & Launch (`// STEP_06_REVIEW`)

Show a summary card of everything collected. User confirms. On confirm:

```typescript
// Submit sequence (sequential, not parallel — profile must exist before preference)
await POST("/profiles/me", profilePayload);
await POST("/preferences/me", preferencePayload);
navigate("/app");
```

**Profile payload:**

```typescript
{
  (name,
    age,
    gender,
    bio,
    city,
    hasRoom,
    occupation,
    photos,
    sleepSchedule,
    noiseLevel,
    guestPolicy,
    smoking,
    pets);
}
```

**Preference payload:**

```typescript
{
  (genderPreference,
    minBudget,
    maxBudget,
    city,
    cleanliness,
    sleepSchedule,
    smoking,
    drinking,
    pets,
    socialLevel,
    weightCleanliness,
    weightSleep,
    weightHabits,
    weightSocial);
}
```

On success → `profile.onboardingCompleted` will be `true` (backend sets this automatically).
Dispatch `setProfile(updatedProfile)` to Redux, then `navigate('/app')`.

---

## 5. Routing Map

```
/                   Landing         (public, no auth required)
/app                Dashboard       (auth + onboarding required)
/app/onboarding     Onboarding      (auth required, skip if already completed)
/app/discover       Discovery       (auth + onboarding required)
/app/matches        Matches         (auth + onboarding required)
/app/chat/:matchId? Chat            (auth + onboarding required)
/app/profile        Profile editor  (auth + onboarding required) ← NEW
/app/settings       Settings        (placeholder)
/app/calendar       Calendar        (placeholder)
/app/filters        Filters         (placeholder)
*                   NotFound
```

Route protection logic:

- Unauthenticated user on any `/app/*` → redirect to `/` (Landing, which shows login)
- Authenticated user with `onboardingCompleted === false` → redirect to `/app/onboarding`
- Authenticated user on `/app/onboarding` with `onboardingCompleted === true` → redirect to `/app`

---

## 6. Page Specifications

### 6.1 Landing (`/`)

Sections (top to bottom):

1. **Hero** — "Find your perfect flatmate" headline + CTA button + profile card visual mockup
2. **How It Works** — 3-step grid: "Set your lifestyle" → "We find your matches" → "Connect and chat"
3. **Trust signals** — "Verified profiles", "Compatibility scoring", "Real-time chat"
4. **CTA banner** — Full-width green section
5. **Footer** — Links

Actions:

- "Get Started Free" → `loginWithRedirect({ screen_hint: 'signup' })`
- "Sign In" → `loginWithRedirect()`

### 6.2 Dashboard (`/app`)

**Fully wired to real API data.** No hardcoded demo stats.

Three-column layout (left | center | right):

**Left — Recent matches activity:**

- `GET /matches/me` → show last 4 matches with avatar, name, compatibility %, last message preview
- Each item links to `/app/chat/:matchId`
- Empty state: "No matches yet — start discovering"

**Center — Your search status:**

- Profile completion indicator (check which Profile fields are filled)
- `profile.hasRoom` status pill ("Has Room" or "Seeking Room")
- `profile.city` displayed
- CTA to `/app/discover` if match count is low

**Right — Your algorithm criteria:**

- From `GET /preferences/me`
- Show: city, budget range, gender preference
- Show weight priorities ranked (derived from weight values)
- Edit button → navigate to `/app/profile` preferences tab

### 6.3 Discovery (`/app/discover`)

Split-panel layout:

**Left panel (320px fixed):** Candidate queue

- Load from `GET /discovery/feed` on mount
- Each row: avatar, name, age, compatibility %, top tag
- Selected row highlighted in mint
- Empty state if feed is empty: "You've seen everyone — check back later"
- Loading skeleton on initial fetch

**Right panel (flex):** Candidate detail

- Large photo (Cloudinary URL from `photos[0]`)
- Name, age, occupation, city
- `hasRoom` badge
- Bio text
- Budget range
- Tags (from API: max 4)
- Lifestyle data grid: sleep schedule, noise level, guest policy, smoking, pets
- Compatibility score (large, monospace, green)
- Two actions:
  - **Pass** → `POST /discovery/swipe { toUserId, action: 'dislike' }` → remove from queue
  - **Connect** → `POST /discovery/swipe { toUserId, action: 'like' }` → remove from queue
  - If `{ matched: true }` in response → show "It's a match!" toast → add to matches

**State management:**

- On Connect/Pass: `dispatch(removeUser(userId))` → auto-selects next candidate
- Feed is paginated locally (all loaded at once from API)

### 6.4 Matches (`/app/matches`)

**Fully wired to `GET /matches/me`.**

Table layout with columns:

- Candidate (avatar + name)
- Compatibility % (monospace, color-coded green/amber/red)
- Status (Matched)
- Last message preview + timestamp
- Actions: "Open Chat" button

Click any row → navigate to `/app/chat/:matchId`
Click "Open Chat" button → same

Empty state: "No matches yet — go discover some people"

### 6.5 Chat (`/app/chat/:matchId?`)

Three-panel layout:

**Left (280px):** Thread list

- Source: `GET /matches/me` (used to build conversation list)
- Each thread: avatar, name, last message, timestamp
- Active thread highlighted

**Center (flex):** Message area

- On thread select: `GET /chat/:matchId` → load conversation + messages
- Socket join: `emit('joinRoom', conversationId)`
- Messages rendered: green bubbles (sent), white bubbles (received)
- Input bar: text input + send button
- Send: optimistic append + `emit('sendMessage', { conversationId, senderId, content })`
- Receive: `socket.on('message', ...)` and `socket.on('new_message', ...)` (both, during compat window)

**Right (280px):** Match intel panel

- Other user's compatibility score
- Budget range
- Tags
- "View Profile" link

Socket events (canonical + aliases must both be handled):

```typescript
socket.emit("joinRoom", conversationId); // canonical
socket.on("message", handler); // canonical
socket.on("new_message", handler); // alias — keep during compat window
```

Message payload shape from server:

```typescript
{ id, senderId, content, createdAt: string, timestamp: string }
// createdAt and timestamp are both ISO strings of the same moment
```

### 6.6 Profile Editor (`/app/profile`) — NEW

Tabbed layout:

- **Tab 1: My Profile** — edit all Profile fields (same form as onboarding steps 1-2-4)
- **Tab 2: Preferences** — edit all Preference fields (same as onboarding steps 3-5)

Submit: `POST /profiles/me` and/or `POST /preferences/me` depending on which tab changed.

---

## 7. Cloudinary Photo Upload

**There is no backend upload endpoint. Use Cloudinary's direct upload API.**

Environment variables required:

```env
VITE_CLOUDINARY_CLOUD_NAME=<your_cloud_name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your_unsigned_preset>
```

Upload flow (frontend only):

```typescript
async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  return data.secure_url; // Store this URL in photos[]
}
```

- Onboarding Step 1: user selects a photo, it uploads immediately, URL stored in form state
- On final submit: `photos` array of URLs is sent in `POST /profiles/me`
- Fallback: if no photo uploaded, use Auth0 `user.picture` as default avatar

---

## 8. Backend API Contract (Do Not Modify Backend)

Base URL: `http://localhost:4000`
Auth header: `Authorization: Bearer <JWT>` (from Auth0 `getAccessTokenSilently()`)

### Key Endpoints

| Method | Path               | Purpose                                 |
| ------ | ------------------ | --------------------------------------- |
| GET    | `/health`          | Health check (no auth)                  |
| GET    | `/users/me`        | Get or create backend user              |
| GET    | `/profiles/me`     | Get user profile (null if none)         |
| POST   | `/profiles/me`     | Create or update profile                |
| GET    | `/preferences/me`  | Get user preferences (null if none)     |
| POST   | `/preferences/me`  | Create or update preferences            |
| GET    | `/discovery/feed`  | Get ranked discovery feed               |
| POST   | `/discovery/swipe` | Record swipe action                     |
| GET    | `/matches/me`      | Get all matches with enriched data      |
| GET    | `/chat/:matchId`   | Get conversation + messages for a match |

Compatibility aliases (still work, but use canonical):

- `GET /discovery` → same as `GET /discovery/feed`
- `POST /matches/connect/:toUserId` → same as POST swipe with `action: 'like'`

### POST /preferences/me — Weight Validation

Weights **must sum to exactly 100** or backend returns `400 { error: "Weights must sum to 100" }`.
The rank-to-weight pattern `[40, 30, 20, 10]` always satisfies this.

### POST /discovery/swipe — Action Values

Accepted: `like | dislike | skip | superlike`
Stored as: `like | dislike` (skip→dislike, superlike→like)

---

## 9. Socket.IO Contract

```typescript
// Connection
const socket = io(runtimeConfig.socketUrl); // from env VITE_SOCKET_URL

// Client → Server (use canonical names)
socket.emit('joinRoom', conversationId: string)
socket.emit('sendMessage', { conversationId: string, senderId: string, content: string })

// Server → Client (subscribe to BOTH during compatibility window)
socket.on('message', (msg) => ...)       // canonical
socket.on('new_message', (msg) => ...)   // alias — keep until explicitly deprecated

// Message payload
interface SocketMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;   // ISO datetime
  timestamp: string;   // ISO datetime — same value as createdAt
}
```

---

## 10. Redux Store Shape

```typescript
// store slices
{
  auth: {
    isAuthenticated: boolean;
    user: Auth0User | null;  // { sub, email, name, picture }
    loading: boolean;
  },
  profile: {
    data: Profile | null;   // from GET /profiles/me
    loading: boolean;
    error: string | null;
  },
  preferences: {
    data: Preference | null;
    loading: boolean;
  },
  onboarding: {
    step: number;           // current wizard step (1-6)
    formData: Partial<OnboardingFormData>;
    submitting: boolean;
    error: string | null;
  },
  discovery: {
    feed: DiscoveryProfile[];
    selectedUserId: string | null;
    loading: boolean;
    error: string | null;
  },
  matches: {
    list: Match[];
    loading: boolean;
    error: string | null;
  },
  chat: {
    conversations: Record<string, Conversation>;
    activeConversationId: string | null;
    loading: boolean;
    error: string | null;
  }
}
```

**Note:** Add a dedicated `profile` slice (separate from `auth`). `AuthSync` must dispatch to both `auth` and `profile` after login.

---

## 11. Environment Variables

```env
# Backend
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000

# Auth0
VITE_AUTH0_DOMAIN=<your-domain>.us.auth0.com
VITE_AUTH0_CLIENT_ID=<your-client-id>
VITE_AUTH0_AUDIENCE=http://localhost:4000

# Cloudinary (new)
VITE_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
VITE_CLOUDINARY_UPLOAD_PRESET=<your-upload-preset>
```

All consumed via `src/config/runtimeConfig.ts` — no direct `import.meta.env` usage in components.

---

## 12. Component File Structure

```
src/
├── main.tsx                       # Auth0Provider → Redux Provider → AuthSync → RouterProvider
├── index.css                      # Design tokens + @import "tailwindcss"
├── config/
│   └── runtimeConfig.ts           # Single config boundary for all env vars
├── app/
│   ├── router.tsx                 # All route definitions
│   ├── store.ts                   # Redux store (7 slices)
│   ├── AppLayout.tsx              # Sidebar + content shell
│   └── ProtectedRoute.tsx         # Auth guard + onboarding gate
├── features/
│   ├── auth/
│   │   ├── AuthSync.tsx           # Fetches /users/me and /profiles/me on login
│   │   └── authSlice.ts
│   ├── profile/
│   │   └── profileSlice.ts        # NEW — separate from auth
│   ├── onboarding/
│   │   ├── OnboardingPage.tsx     # 6-step wizard
│   │   ├── steps/
│   │   │   ├── Step1Identity.tsx
│   │   │   ├── Step2Housing.tsx
│   │   │   ├── Step3Budget.tsx
│   │   │   ├── Step4Lifestyle.tsx
│   │   │   ├── Step5Weights.tsx
│   │   │   └── Step6Review.tsx
│   │   └── onboardingSlice.ts
│   ├── dashboard/
│   │   └── DashboardPage.tsx      # Wired to real API
│   ├── discovery/
│   │   ├── DiscoveryPage.tsx
│   │   ├── CandidateQueue.tsx
│   │   ├── CandidateDetail.tsx
│   │   ├── discoverySlice.ts
│   │   └── discovery.transport.ts # API calls
│   ├── matches/
│   │   ├── MatchesPage.tsx
│   │   ├── matchesSlice.ts
│   │   └── matches.transport.ts
│   ├── chat/
│   │   ├── ChatPage.tsx
│   │   ├── ThreadList.tsx
│   │   ├── MessageArea.tsx
│   │   ├── MatchIntelPanel.tsx
│   │   ├── chatSlice.ts
│   │   ├── chat.transport.ts
│   │   └── chat.socket.ts         # Socket instance + event handlers
│   ├── preferences/
│   │   └── preferencesSlice.ts
│   └── profile-editor/
│       └── ProfileEditorPage.tsx  # NEW
├── components/
│   ├── common/
│   │   ├── Stepper.tsx
│   │   ├── TileRadio.tsx          # Reusable from onboarding
│   │   ├── RankPicker.tsx         # NEW — for weight step
│   │   └── CloudinaryUpload.tsx   # NEW — photo upload widget
│   ├── layout/
│   │   ├── AppSidebar.tsx
│   │   └── Navbar.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Slider.tsx             # NEW — for 1-5 scales
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       ├── Toast.tsx              # NEW — for match notification
│       └── index.ts
├── services/
│   ├── api.ts                     # Axios instance + apiRequest()
│   └── cloudinary.ts              # uploadToCloudinary()
├── lib/
│   └── utils.ts                   # cn() utility
└── types/
    └── index.ts                   # All TypeScript interfaces
```

---

## 13. TypeScript Interfaces

```typescript
// src/types/index.ts

export interface User {
  id: string;
  auth0id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  name?: string;
  age?: number;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  bio?: string;
  photos: string[];
  city?: string;
  hasRoom: boolean;
  occupation?: "student" | "professional";
  sleepSchedule?: "early-bird" | "night-owl" | "flexible";
  noiseLevel?: number;
  guestPolicy?: "never" | "rarely" | "sometimes" | "often";
  smoking?: "no" | "outside" | "yes";
  pets?: "no" | "have" | "love" | "allergic";
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Preference {
  id: string;
  userId: string;
  genderPreference: "male" | "female" | "any";
  minBudget: number;
  maxBudget: number;
  city: string;
  cleanliness: number;
  sleepSchedule: number;
  smoking: boolean;
  drinking: boolean;
  pets: boolean;
  socialLevel: number;
  weightCleanliness: number;
  weightSleep: number;
  weightHabits: number;
  weightSocial: number;
}

export interface DiscoveryProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  occupation?: string;
  city?: string;
  hasRoom: boolean;
  photos: string[];
  compatibility: number;
  budgetMin?: number;
  budgetMax?: number;
  tags: string[];
}

export interface Match {
  id: string;
  matchedAt: string;
  createdAt: string;
  otherUser: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    occupation?: string;
    city?: string;
    hasRoom: boolean;
    photos: string[];
    budgetMin?: number;
    budgetMax?: number;
    tags: string[];
  };
  compatibility: number;
  lastMessage?: string;
  conversationId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  matchId: string;
  messages: Message[];
  createdAt: string;
}
```

---

## 14. Matching Algorithm — Weight Behavior

The backend matching algorithm computes compatibility as:

```
score = (cleanliness_similarity × weightCleanliness)
      + (sleep_similarity × weightSleep)
      + (habits_similarity × weightHabits)
      + (social_similarity × weightSocial)
```

Weights default to `25/25/25/25` if left at defaults — this makes the algorithm **unweighted** in effect (everyone gets similar scores). This is the core reason the discovery feed feels random. The fix is collecting weights during onboarding using the rank-to-weight pattern.

The score is **asymmetric**: A's feed uses A's weights to rank candidates. B's feed uses B's weights. This is intentional — each user's feed is personalized.

Maximum score = 100 (all similarities perfect, weights sum to 100).

---

## 15. Sidebar Navigation

```
Dashboard     /app              (icon: grid)
Discovery     /app/discover     (icon: compass)
Matches       /app/matches      (icon: users, badge: match count)
Messages      /app/chat         (icon: message-circle, badge: unread dot)
Calendar      /app/calendar     (icon: calendar, badge: "Soon")
── bottom ──
Filters       /app/filters      (icon: sliders, badge: "Soon")
Settings      /app/settings     (icon: settings)
── user section ──
Avatar + name + monospace auth0 ID prefix
```

Calendar and Filters show "Coming soon" badge and render a placeholder page (Policy A). They are clickable but non-functional.

---

## 16. Critical Implementation Rules

1. **Never hardcode demo data in production components.** All pages must fetch from the API.
2. **Always handle loading, empty, and error states** on every async operation.
3. **Onboarding gate must be enforced in `ProtectedRoute`**, not in individual pages.
4. **Socket must be a singleton** — instantiate once in `chat.socket.ts`, reuse everywhere.
5. **Never duplicate API base URL** — always use `runtimeConfig.apiBaseUrl`.
6. **Photo fallback**: if `profile.photos` is empty, use `auth0User.picture`. Never show a broken image.
7. **Weight constraint**: never allow preference submission with weights ≠ 100. The rank-to-weight pattern guarantees this, but validate before submit anyway.
8. **Onboarding is sequential** — user cannot skip steps. Each step validates before proceeding.
9. **Match creation is detected on swipe response** — check `{ matched: true }` in swipe response and show match toast.
10. **Do not remove alias socket listeners** (`new_message`) — the backend still emits them.

---

## 17. Agent Workflow for This Build

Recommended execution order:

```
1. architect  — Review this CLAUDE.md, confirm file structure, identify risks
2. planner    — Break into implementation tasks per page/feature
3. builder    — Implement in this order:
     a. Design system tokens + shared UI components
     b. Auth flow (AuthSync, ProtectedRoute, profileSlice)
     c. Onboarding wizard (all 6 steps + Cloudinary upload)
     d. Dashboard (wired to API)
     e. Discovery page (feed + swipe)
     f. Matches page
     g. Chat page (Socket.IO)
     h. Profile editor
     i. Placeholders (calendar, filters, settings)
4. typescript-reviewer — Type safety pass after each feature
5. code-reviewer       — Quality and security pass
6. e2e-runner          — Test critical flows: onboarding, swipe→match, chat
```

**Do not build UI in a different order.** Auth and onboarding must work before any other page is testable.

---

## 18. What NOT To Do

- Do not modify anything in `backend/`
- Do not change API endpoints, add new endpoints, or alter response shapes
- Do not remove alias REST routes or socket events (backward compat window is active)
- Do not add mobile breakpoints (desktop-only build)
- Do not use `localStorage` or `sessionStorage` for any auth or profile data (use Redux)
- Do not leave any `console.log` in production code
- Do not use TailwindCSS v3 syntax — this project uses v4 (`@theme`, `@import "tailwindcss"`)
