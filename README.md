# MemoFlows

A minimalist, cross-platform timeline memo and journaling application. Captures thoughts, moments, and photos in a continuous flow of time.

---

## Workspace Structure

This monorepo is managed with [Turborepo](https://turbo.build/repo) and [pnpm](https://pnpm.io/):

```
memoflows/
├── apps/
│   ├── web/        # Next.js 16 (App Router), React 19, Tailwind CSS v4, Clerk, Convex
│   └── mobile/     # Universal mobile app powered by Expo SDK 58, React Native, Expo Router
└── packages/
    ├── ui/                 # Shared UI component library (shadcn/ui tokens + Tailwind CSS v4)
    ├── typescript-config/  # Shared tsconfig definitions across workspaces
    └── eslint-config/      # Shared ESLint configuration rules
```

---

## Features

- **Continuous timeline**: Chronological stream organized by granular views:
  - **Day view**: 24-hour vertical rail displaying exact note timestamps with automatic active-hour anchor.
  - **Month view**: Full month calendar grid with day counts and preview notes.
  - **Year view**: 12-month overview for jumping across seasons and years.
- **Micro-journaling & photo attachments**: Frictionless memo editor with support for multi-image uploads powered by Convex file storage.
- **PIN-protected vault**: Starred and sensitive memos locked behind client-side SHA-256 hashed PIN authentication.
- **Lightning search**: Modal search dialog triggered by `/` or `Cmd+K` / `Ctrl+K` for instant query filtering across all memos.
- **Keyboard navigation**: `ArrowLeft` and `ArrowRight` shortcuts to shift days, months, or years effortlessly.
- **Dark-first design system**: Warm charcoal canvas (`#08090b`), paper white light mode (`#faf9f6`), solid matte cards, and desaturated mineral accents. Detailed tokens are in [DESIGN.md](./DESIGN.md).

---

## Tech Stack

- **Frameworks**: Next.js 16, Expo SDK 58 (React Native 0.88), React 19
- **Backend & Database**: [Convex](https://convex.dev) (real-time sync, file storage, indexing)
- **Authentication**: [Clerk](https://clerk.com) (`@clerk/nextjs`, `@clerk/clerk-expo`)
- **Styling**: Tailwind CSS v4, shadcn/ui components in `@workspace/ui`
- **Monorepo Engine**: Turborepo, pnpm workspaces

---

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- pnpm >= 11.25.0

### Installation

```bash
pnpm install
```

### Environment Setup

1. **Convex backend**:
   ```bash
   npx convex dev
   ```

2. **Web (`apps/web/.env.local`)**:
   ```env
   NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Mobile (`apps/mobile/.env`)**:
   ```env
   EXPO_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

### Development

Run all applications and packages concurrently:

```bash
pnpm dev
```

Or run individual apps:

```bash
# Run web client (http://localhost:3000)
pnpm --filter web dev

# Run mobile client with Expo CLI
pnpm --filter mobile start
```

### Build & Verification

```bash
# Build all workspaces
pnpm build

# Run linting
pnpm lint

# Run TypeScript typechecks
pnpm typecheck
```

---

## Design System

Refer to [DESIGN.md](./DESIGN.md) for complete token specifications, elevation rules, typography scales, and component guidelines.
