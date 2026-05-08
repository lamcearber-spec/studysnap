# BaraBara

An iPad/iOS app for elementary and middle school kids to photograph completed classwork and get AI-generated practice exercises to prepare for exams. Mascot: a calm, clever capybara. Brand voice: chill, encouraging, premium. Monetized with two RevenueCat tiers: Starter ($4.99/mo or $49.90/yr, 40 image-edited exercises per billing month) and Premium ($9.99/mo or $99.90/yr, 100 image-edited exercises per billing month).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` - run the API server
- `pnpm --filter @workspace/mobile run dev` - run the Expo mobile app
- `pnpm run typecheck` - full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` - regenerate API hooks/Zod schemas, then fix `lib/api-zod/src/index.ts`
- `pnpm --filter @workspace/scripts run seed:revenuecat` - re-seed RevenueCat products, packages, entitlements, and offering
- Required env: `GOOGLE_GEMINI_API_KEY`, `FAL_API_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `DATABASE_URL`, `REVENUECAT_WEBHOOK_SECRET`
- Required env: `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` - set from seed script output

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54), React Native, Expo Router
- API: Express 5
- Vision: Gemini 3 Pro via `@google/genai`
- Image edit: FLUX.1 Kontext [dev] via Fal.ai
- Storage: Cloudflare R2
- Quota DB: Replit Postgres
- Payments: RevenueCat (`react-native-purchases`) - Starter and Premium entitlements
- Validation: Zod, Orval codegen from OpenAPI spec

## Where things live

- `lib/api-spec/openapi.yaml` - API contract (source of truth)
- `artifacts/api-server/src/routes/exercises.ts` - Gemini vision, FLUX image edit, R2 cache, and quota-aware exercise generation
- `artifacts/api-server/src/routes/usage.ts` - quota API and RevenueCat webhook
- `artifacts/api-server/src/db/schema.sql` - server-authoritative usage counter schema
- `artifacts/mobile/app/onboarding/` - 4-step onboarding (country -> grade -> subjects -> difficulty)
- `artifacts/mobile/app/paywall.tsx` - two-tier subscription paywall screen
- `artifacts/mobile/app/quota-exceeded.tsx` - quota-exceeded modal with text-only continuation
- `artifacts/mobile/app/settings/` - settings hub with user, account, display sub-screens
- `artifacts/mobile/hooks/useAppReview.ts` - app store review prompt logic (10/20 session thresholds)
- `artifacts/mobile/lib/revenuecat.tsx` - RevenueCat init, SubscriptionProvider, tier detection, app user ID
- `artifacts/mobile/context/ProfileContext.tsx` - AsyncStorage-backed user profile
- `artifacts/mobile/context/SessionContext.tsx` - AsyncStorage-backed session state
- `artifacts/mobile/constants/data.ts` - countries (US, GB, DE, FR), grades, subjects, difficulties
- `artifacts/mobile/components/Mascot.tsx` - capybara mascot component
- `artifacts/mobile/components/SubjectIcon.tsx` - Phosphor icon per subject
- `artifacts/mobile/components/DifficultyIcon.tsx` - Phosphor icon per difficulty
- `scripts/src/seedRevenueCat.ts` - seed script for RevenueCat project/products/entitlements

## Architecture decisions

- No auth; student profile and completed sessions stay in AsyncStorage on-device
- Server-authoritative image quota metering lives in Postgres and is keyed by RevenueCat `app_user_id`
- Exercises generated server-side; Gemini, Fal.ai, and R2 keys never reach the mobile client
- Image sent as base64 in request body (no multipart upload)
- Image-edited exercise URLs are content-addressed and cached in R2 at `edits/{sha256}.png`
- RevenueCat test store used in dev/Expo Go; production keys used when published
- Navigation guard only enforces onboarding profile presence. Scan/paywall access is handled in scan/home routes.
- After codegen, manually fix `lib/api-zod/src/index.ts` to only export `./generated/api`

## Product

- **Onboarding (4 steps)**: Name + Country (sets language) -> Grade 1-8 -> Subjects -> Difficulty
- **Paywall**: Starter and Premium cards with monthly/annual packages via RevenueCat
- **Free use**: one scan per local day can be used without subscribing
- **Visual exercise caps**: Starter 40 image-edited exercises/month, Premium 100 image-edited exercises/month. Text-only exercises do not count.
- Kids scan classwork -> AI generates 8 exercises aligned to their national curriculum, language, and grade
- If a worksheet has visuals, generated practice can include image-edited variants of cropped regions from the original page
- Interactive exercise answering with instant feedback
- Session history with progress tracking - parent-reviewable under the student's profile name
- Settings screen to edit name, grade, subjects, difficulty; reset to redo onboarding; and manage plan/usage
- **App Store review prompt**: after session 10, then again after session 20 (max 2 prompts ever)

## Gotchas

- After codegen, overwrite `lib/api-zod/src/index.ts` to only have `export * from "./generated/api";`
- `react-native-purchases` must be installed in `artifacts/mobile`, NOT the workspace root
- `@replit/revenuecat-sdk` must be installed at workspace root (`pnpm add -w`)
- RevenueCat test store prices are immutable once set; free trials are not supported in test store
- `initializeRevenueCat()` is called at module level in `_layout.tsx` (outside any component)
- R2 bucket should not be listable. Public access should be through object URLs only.
- `phosphor-react-native` is installed in `artifacts/mobile` for Phosphor icons

## Pointers

- RevenueCat entitlement identifiers: `starter`, `premium`
- RevenueCat project ID: stored in `REVENUECAT_PROJECT_ID` env var
- App Store Connect IAP product IDs: `barabara_starter_monthly`, `barabara_starter_annual`, `barabara_premium_monthly`, `barabara_premium_annual`
- Apple Small Business Program (15% vs 30%) - enroll before launch: https://developer.apple.com/app-store/small-business-program/enroll/
- Sync RevenueCat -> App Store Connect via Replit Publishing pane after TestFlight publish
