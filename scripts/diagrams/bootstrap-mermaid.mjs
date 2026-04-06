#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const manifestArg = process.argv[2] ?? "diagrams/manifest.json";
const manifestPath = path.resolve(process.cwd(), manifestArg);

const STARTERS = {
    class: `classDiagram
  direction LR
  class User {
    +id: UUID
    +email: string
    +status: UserStatus
  }
  class Profile {
    +displayName: string
    +city: string
  }
  class Preference {
    +budget: number
    +moveInDate: Date
  }
  class MatchService {
    +computeCompatibility(userA, userB): number
    +createMatch(userA, userB): Match
  }
  class Match {
    +id: UUID
    +score: number
  }
  class UserRepository {
    +findById(id): User
    +save(user): User
  }
  User "1" --> "1" Profile : owns
  User "1" --> "1" Preference : sets
  MatchService --> UserRepository : reads
  MatchService --> Match : creates
  Match --> User : links
`,
    object: `flowchart LR
  U1["user:User"]
  P1["profile:Profile"]
  Pref1["preference:Preference"]
  M1["match:Match"]
  C1["conversation:Conversation"]
  Msg1["message:Message"]

  U1 --> P1
  U1 --> Pref1
  U1 --> M1
  M1 --> C1
  C1 --> Msg1
`,
    "use-case": `flowchart LR
  subgraph Actors
    Guest((Guest))
    User((User))
    Admin((Admin))
  end

  subgraph System[System Use Cases]
    UC1([Register/Login])
    UC2([Complete Onboarding])
    UC3([Discover Candidates])
    UC4([Like/Pass Candidate])
    UC5([Open Match Chat])
    UC6([Moderate and Support])
  end

  Guest --> UC1
  User --> UC2
  User --> UC3
  User --> UC4
  User --> UC5
  Admin --> UC6
`,
    activity: `flowchart TD
  Start([Start]) --> Auth{Authenticated?}
  Auth -- No --> Login[Login or Sign Up]
  Login --> Profile[Complete Profile + Preferences]
  Auth -- Yes --> ProfileGate{Onboarding Complete?}
  ProfileGate -- No --> Profile
  ProfileGate -- Yes --> Feed[Load Discovery Feed]
  Feed --> Swipe{Like Candidate?}
  Swipe -- Yes --> MatchCheck{Mutual Like?}
  MatchCheck -- Yes --> Match[Create Match + Conversation]
  Match --> Chat[Open Chat]
  MatchCheck -- No --> Feed
  Swipe -- No --> Feed
  Chat --> End([End])
`,
    sequence: `sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant API as Backend API
  participant SVC as Matching Service
  participant DB as Database

  U->>FE: Submit swipe action
  FE->>API: POST /discovery/swipe
  API->>SVC: evaluateSwipe(userId, targetId, direction)
  SVC->>DB: saveSwipe()
  DB-->>SVC: swipeSaved
  SVC->>DB: checkMutualLike()
  DB-->>SVC: mutualLike=true|false
  SVC-->>API: swipeResult
  API-->>FE: response(payload)
  FE-->>U: update UI state
`,
    erd: `erDiagram
  USER ||--|| PROFILE : has
  USER ||--|| PREFERENCE : has
  USER ||--o{ SWIPE : creates
  USER ||--o{ MATCH : participates
  MATCH ||--|| CONVERSATION : opens
  CONVERSATION ||--o{ MESSAGE : contains
`
};

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exit(1);
}

if (!existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`);
}

let manifest;
try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
    fail(`Invalid manifest JSON: ${error.message}`);
}

if (!Array.isArray(manifest.diagrams)) {
    fail("manifest.diagrams must be an array.");
}

for (const entry of manifest.diagrams) {
    const outputPath = path.resolve(process.cwd(), entry.source);
    if (existsSync(outputPath)) {
        continue;
    }

    const starter = STARTERS[entry.type] ?? "flowchart LR\n  TODO[Add Mermaid diagram content]\n";
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, starter);
    console.log(`Created starter: ${path.relative(process.cwd(), outputPath)}`);
}

console.log("Mermaid starter bootstrap complete.");
