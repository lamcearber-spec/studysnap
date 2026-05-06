# StudySnap

An iPad/iOS app for elementary and middle school kids to photograph completed classwork and get AI-generated practice exercises to prepare for exams. Monetized at $4.99/month via RevenueCat.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod schemas (then fix `lib/api-zod/src/index.ts`)
- `pnpm --filter @workspace/scripts run seed:revenuecat` — re-seed RevenueCat (idempotent)
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — auto-provisioned via Replit AI Integrations
- Required env: `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` — set from seed script output

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54), React Native, Expo Router
- API: Express 5
- AI: OpenAI GPT-5.1 vision via Replit AI Integrations
- Payments: RevenueCat (`react-native-purchases`) — $4.99/month, entitlement: `premium`
- Validation: Zod, Orval codegen from OpenAPI spec

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `artifacts/api-server/src/routes/exercises.ts` — exercise generation route
- `artifacts/mobile/app/onboarding/` — 4-step onboarding (country → grade → subjects → difficulty)
- `artifacts/mobile/app/paywall.tsx` — subscription paywall screen
- `artifacts/mobile/app/settings.tsx` — editable profile settings (name, grade, subjects, difficulty)
- `artifacts/mobile/hooks/useAppReview.ts` — app store review prompt logic (10/20 session thresholds)
- `artifacts/mobile/lib/revenuecat.tsx` — RevenueCat init, SubscriptionProvider, useSubscription hook
- `artifacts/mobile/context/ProfileContext.tsx` — AsyncStorage-backed user profile
- `artifacts/mobile/context/SessionContext.tsx` — AsyncStorage-backed session state
- `artifacts/mobile/constants/data.ts` — countries, grades, subjects, difficulties
- `scripts/src/seedRevenueCat.ts` — seed script for RevenueCat project/products/entitlements

## Architecture decisions

- No auth, no server-side DB — everything stored in AsyncStorage on-device
- Exercises generated server-side (OpenAI key stays secure)
- Image sent as base64 in request body (no multipart upload)
- RevenueCat test store used in dev/Expo Go; production keys used when published
- Navigation guard in `_layout.tsx` uses `useSegments` + 3s timeout fallback for subscription loading
- After codegen, manually fix `lib/api-zod/src/index.ts` to only export `./generated/api`

## Product

- **Onboarding (4 steps)**: Name + Country (sets language) → Grade 1-8 → Subjects → Difficulty
- **Paywall**: $4.99/month via RevenueCat, shown after onboarding and enforced on every launch
- Kids scan classwork → AI generates 8 exercises aligned to their national curriculum, language, and grade
- Interactive exercise answering with instant feedback
- Session history with progress tracking — parent-reviewable under the student's profile name
- Settings screen to edit name, grade, subjects, difficulty; reset to redo onboarding
- **App Store review prompt**: after session 10, then again after session 20 (max 2 prompts ever)

## Gotchas

- After codegen, overwrite `lib/api-zod/src/index.ts` to only have `export * from "./generated/api";`
- `react-native-purchases` must be installed in `artifacts/mobile`, NOT the workspace root
- `@replit/revenuecat-sdk` must be installed at workspace root (`pnpm add -w`)
- RevenueCat test store prices are immutable once set; free trials not supported in test store
- `initializeRevenueCat()` is called at module level in `_layout.tsx` (outside any component)

## Pointers

- RevenueCat entitlement identifier: `premium`
- RevenueCat project ID: stored in `REVENUECAT_PROJECT_ID` env var
- Apple Small Business Program (15% vs 30%) — enroll before launch: https://developer.apple.com/app-store/small-business-program/enroll/
- Sync RevenueCat → App Store Connect via Replit Publishing pane after TestFlight publish
