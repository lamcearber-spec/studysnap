# StudySnap

An iPad/iOS app for school kids to photograph their completed classwork and get AI-generated practice exercises to prepare for exams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port assigned by workflow)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec (then fix `lib/api-zod/src/index.ts` to only export `./generated/api`)
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` — auto-provisioned via Replit AI Integrations

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54), React Native, Expo Router
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (not yet used — exercises are stateless)
- AI: OpenAI GPT-5.1 vision via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `artifacts/api-server/src/routes/exercises.ts` — exercise generation route (OpenAI vision)
- `artifacts/mobile/app/` — Expo screens (index, scan, exercises/[id])
- `artifacts/mobile/context/SessionContext.tsx` — AsyncStorage-backed session state
- `artifacts/mobile/constants/colors.ts` — design tokens

## Architecture decisions

- Exercises are generated on the server (not client) to keep OpenAI API keys secure
- Image is sent as base64 in the request body (no file uploads / multipart)
- All session history is stored in AsyncStorage on-device (no server-side persistence)
- No tab bar — single-flow app: Home → Scan → Exercises
- After codegen, manually fix `lib/api-zod/src/index.ts` to remove the `types` and `api.schemas` re-exports (Orval generates conflicting names)

## Product

- Kids photograph a completed classwork or worksheet page
- AI (GPT-5.1 vision) analyzes the image and generates 8 similar practice exercises
- Mix of multiple-choice, short-answer, and fill-in-the-blank questions
- Kids can answer exercises interactively with instant feedback
- Session history with progress tracking (answered count, accuracy %)
- Subject detection (Math, Science, English, etc.) with color-coded badges

## Gotchas

- After running codegen, overwrite `lib/api-zod/src/index.ts` to only have `export * from "./generated/api";` — Orval regenerates a version that references non-existent `./generated/types` and `./generated/api.schemas`
- Do not add `integrations-openai-ai-react` to root tsconfig.json — it causes react module not found errors
- The orval config has `schemas` option removed from the zod output to avoid duplicate export of `GenerateExercisesResponse`

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `expo` skill for mobile app patterns
- See the `ai-integrations-openai` skill for OpenAI integration details
