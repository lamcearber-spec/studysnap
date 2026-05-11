import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";
import { getCurriculumContext } from "../curriculum.js";
import { ImageEditError, QuotaExceededError, VisionError } from "../errors.js";
import { getUsageQuota, reserveImageQuota, type UsageQuota } from "../db/client.js";

const router = Router();

const SYSTEM_PROMPT = `You are a senior curriculum designer and assessment-item writer for the
MarmotMakesMath practice app. Your job: turn a photograph of a child's
math classwork into a parallel practice worksheet that builds the same
skills with different content.

═══ ROLE & STANDARDS ═══

You are not an entertainer. You are writing items that will be used by parents
and teachers to verify mastery. Treat every exercise like a low-stakes
formative-assessment question. Your reputation rests on:

1. PEDAGOGICAL FIDELITY — each generated item must test the same skill,
   sub-skill, and difficulty as its photographed counterpart. If the original
   is a single-step word problem, the variation is a single-step word problem
   (not a two-step). If the original tests subtraction-with-borrowing, do not
   silently swap to subtraction-without-borrowing.

2. CURRICULUM AUTHENTICITY — when the user provides a country and grade, the
   national-curriculum block in the user message names the framework, the
   grade-band label, and the topics typical for that band. Use the EXACT
   terminology, vocabulary, and question phrasing that framework uses.

3. CULTURAL + LINGUISTIC LOCALISATION — names, currencies, units, places,
   foods, holidays, sports, and proper nouns must match the country:
   • United States 🇺🇸 — names: Aiden, Maya, Jamal, Sofia. Currency: $ / cents.
     Units: inches, feet, miles, oz, lb, °F.
   • United Kingdom 🇬🇧 — names: Oliver, Amelia, Noah, Aisha. Currency: £ / p.
     Units: cm, m, km, g, kg, °C. Spelling: British.
   • Germany 🇩🇪 — names: Lukas, Mia, Felix, Emma, Yusuf. Währung: € / Cent.
     Einheiten: cm, m, km, g, kg, °C.
   • France 🇫🇷 — prénoms: Lucas, Emma, Léo, Chloé, Yanis. Monnaie: € / centimes.
     Unités: cm, m, km, g, kg, °C.
   • Spain 🇪🇸 — nombres: Hugo, Lucía, Daniel, Sofía. Moneda: € / céntimos.
     Unidades: cm, m, km, g, kg, °C.
   Vary names across exercises — do not use the same name multiple times.

═══ SCOPE — MATH ONLY ═══

MarmotMakesMath is a math-only practice app. Generate ONLY math exercises:
arithmetic, word problems, fractions, decimals, percentages, geometry, time,
money, units, patterns, simple algebra, data + graphs. If the photographed
worksheet is NOT math (reading, writing, science, etc.), return an empty
exercises array and set subject="Non-math" with topic="Not a math worksheet".

═══ INPUT INTERPRETATION ═══

The image may be a full worksheet page OR a tightly-cropped single exercise.
Treat both identically:
1. Count every DISTINCT math exercise. Number them.
2. For each, identify (a) the skill being tested, (b) the question type, (c) any
   visual elements (cubes, fractions, clocks, money, shapes, charts).
3. Generate exactly that many parallel exercises — one variation per original,
   preserved order.

═══ DIFFICULTY CONTRACT ═══

EASIER: scaffold without skipping the skill. Reduce numbers ~30%. Add a one-line
hint. Keep skill identical.

SAME: structurally identical, content varied. Numbers may shift ±20%.

HARDER: extend without changing topic. Add ONE step OR slightly more abstract
framing. Do NOT just inflate numbers.

═══ VISUAL SPECIFICATION (procedural primitives) ═══

When an original exercise has a visual element (e.g. "count the cubes",
"shade 1/4 of the circle", "what time is shown"), provide a 'visual' field in
the parallel exercise referencing ONE of these 15 procedural primitives the
client renders client-side. NEVER specify a raster image.

Available primitives + example props:
• CubeArray         { count: 7, layout: "2x3+1" }
• DotArray          { count: 13, frameType: "tenFrame" | "grid" }
• Fraction          { whole: 4, parts: 1, style: "pie" | "bar" | "numberLine" }
• Clock             { hours: 3, minutes: 30, style: "analog" | "digital" }
• NumberLine        { min: 0, max: 20, marks: [3, 7, 12] }
• ShapeBasic        { type: "triangle" | "square" | "rectangle" | "circle" | "pentagon" | "hexagon", size: 80 }
• Money             { currency: "EUR" | "USD" | "GBP", denominations: [50, 20, 10, 5] }
• Scale             { leftWeight: 5, rightWeight: 3 }
• Thermometer       { value: 22, unit: "C" | "F", min: 0, max: 40 }
• BarChart          { data: [{ label: "Mon", value: 5 }] }
• PieChart          { slices: [{ label: "A", value: 25 }] }
• AreaGrid          { rows: 4, cols: 6, shaded: [0, 1] }
• TallyMarks        { count: 13 }
• GeometricSolid    { type: "cube" | "sphere" | "cylinder" | "cone" | "prism", size: 80 }
• PatternSequence   { pattern: ["A", "B", "A", "?", "A", "B"], answer: "B" }

Set visual to null for purely-arithmetic exercises that don't need a picture.

═══ OUTPUT CONTRACT ═══

Return STRICT JSON of shape:
{
  subject: string,                     // e.g. "Math"
  topic: string,                       // e.g. "Two-digit addition with regrouping"
  exercises: [
    {
      id: string,                      // stable per-position, e.g. "ex-1"
      type: "multiple-choice" | "short-answer" | "fill-blank",
      question: string,                // localised to the user's language
      options: string[]?,              // exactly 4 if multiple-choice
      answer: string,                  // canonical correct answer
      visual: { primitive: string, props: object } | null
    }
  ]
}

Strict requirements:
• Write subject / topic / questions / options / answers ALL in the user's language.
• Multiple-choice: exactly 4 options. The correct one MUST be one of them.
• Plausibility distractors: wrong options should be common errors, not random.
• answer field: provide the canonical answer even for fill-blank and short-answer
  — the parent uses it to grade ✓ / ✗.
• If exercises is empty, subject MUST be "Non-math" and topic "Not a math worksheet".

═══ ANTI-PATTERNS — NEVER ═══

• NEVER use "Sarah", "John", or other clichéd AI names if a country is set.
• NEVER write currency mismatched to the country.
• NEVER write a HARDER variant that is just SAME with bigger numbers.
• NEVER include emoji, markdown, or LaTeX in the output JSON.
• NEVER answer the exercise inside the question text.
• NEVER write more or fewer exercises than were in the original image.
• NEVER write a multiple-choice answer that doesn't match exactly one option.
• NEVER specify a raster-image visual — only the 15 procedural primitives above.

You are graded by parents. Be precise.`;

const exerciseTypeSchema = z.enum(["multiple-choice", "short-answer", "fill-blank"]);

const generateRequestSchema = z.object({
  imageBase64: z.string().min(1),
  appUserId: z.string().min(1),
  subject: z.string().optional(),
  grade: z.string().optional(),
  language: z.string().optional(),
  difficulty: z.enum(["easier", "same", "harder"]).optional(),
  countryCode: z.string().optional(),
});

const visualPrimitiveSchema = z.object({
  primitive: z.string().min(1),
  props: z.record(z.string(), z.any()),
});

const visionExerciseSchema = z.object({
  id: z.string().min(1),
  type: exerciseTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.string().optional(),
  visual: visualPrimitiveSchema.nullable().optional(),
});

const visionOutputSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  exercises: z.array(visionExerciseSchema),
});

type GenerateRequest = z.infer<typeof generateRequestSchema>;
type VisionOutput = z.infer<typeof visionOutputSchema>;
type VisionExercise = z.infer<typeof visionExerciseSchema>;

type ExerciseResponse = {
  id: string;
  type: z.infer<typeof exerciseTypeSchema>;
  question: string;
  options?: string[];
  answer?: string;
  visual?: { primitive: string; props: Record<string, unknown> };
  imageUrl?: string;
};

type GenerateResponse = {
  exercises: ExerciseResponse[];
  subject: string;
  topic: string;
  quota: UsageQuota;
};

type QuotaExceededResponse = GenerateResponse & {
  error: "QUOTA_EXCEEDED";
};

function getDifficultyInstruction(difficulty: GenerateRequest["difficulty"]) {
  if (difficulty === "easier") {
    return [
      "DIFFICULTY: easier",
      "- Reduce numerical magnitude by ~30%.",
      "- Add a one-line hint at the end of the question prompt that scaffolds the first step.",
      "- Keep the SAME skill, sub-skill, and number of steps.",
    ].join("\n");
  }
  if (difficulty === "harder") {
    return [
      "DIFFICULTY: harder",
      "- Add ONE extra step OR move to slightly more abstract framing.",
      "- Stay in the SAME topic and sub-skill.",
      "- Do NOT just inflate numbers — that is tedium, not skill increase.",
    ].join("\n");
  }
  return [
    "DIFFICULTY: same",
    "- Structurally identical, content varied. Numbers may shift ±20%.",
    "- Same vocabulary tier, same question stem pattern, same number of steps.",
  ].join("\n");
}

function getCurriculumInstruction(countryCode?: string, grade?: string) {
  if (!countryCode || !grade) {
    return [
      "CURRICULUM: not specified.",
      "- Use age-typical content. Do not name any specific national framework.",
      "- Default to neutral English (American spelling, US units).",
    ].join("\n");
  }
  const curriculum = getCurriculumContext(countryCode, grade);
  if (!curriculum) {
    return [
      `CURRICULUM: country ${countryCode}, grade ${grade}.`,
      "- No structured curriculum data available for this combination.",
      "- Use the country's typical age-cohort expectations and educational vocabulary.",
    ].join("\n");
  }
  return [
    `CURRICULUM: ${curriculum.systemName} — ${curriculum.gradeBandLabel}.`,
    `TOPICS + VOCABULARY: ${curriculum.context}`,
    "BINDING: Use the exact terminology, spelling conventions, units, and question phrasing of this framework.",
  ].join("\n");
}

function buildUserMessage(input: GenerateRequest) {
  const lines: string[] = [
    "TASK",
    "Analyse the photographed worksheet. Count every distinct math exercise. Generate exactly one parallel practice variation per original — preserve order, preserve count, preserve skill.",
    "",
    "INPUT METADATA",
    input.subject ? `- Subject hint: ${input.subject}` : "- Subject hint: (none — math is the only allowed scope)",
    input.grade ? `- Grade level: ${input.grade}` : "- Grade level: (not specified)",
    input.countryCode ? `- Country: ${input.countryCode}` : "- Country: (not specified)",
    input.language
      ? `- Language: Write ALL output (subject, topic, questions, options, answers) in ${input.language}.`
      : "- Language: English",
    "",
    getDifficultyInstruction(input.difficulty),
    "",
    getCurriculumInstruction(input.countryCode, input.grade),
    "",
    "REMINDER",
    "- Output STRICT JSON only. No markdown. No code fences. No commentary.",
    "- One exercise per detected original.",
    "- Visuals: use ONLY the 15 procedural primitives, never raster image references.",
  ];
  return lines.filter(Boolean).join("\n");
}

function normalizeBase64(imageBase64: string) {
  const marker = ";base64,";
  const markerIndex = imageBase64.indexOf(marker);
  return markerIndex >= 0 ? imageBase64.slice(markerIndex + marker.length) : imageBase64;
}

function toExerciseResponse(exercise: VisionExercise): ExerciseResponse {
  return {
    id: exercise.id,
    type: exercise.type,
    question: exercise.question,
    options: exercise.options,
    answer: exercise.answer,
    visual: exercise.visual ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Azure OpenAI vision call (GPT-5.1)
// ─────────────────────────────────────────────────────────────────────────────

function getAzureClient() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-12-01-preview";

  if (!apiKey) throw new VisionError("AZURE_OPENAI_API_KEY is required");
  if (!endpoint) throw new VisionError("AZURE_OPENAI_ENDPOINT is required");

  return new OpenAI({
    apiKey,
    baseURL: `${endpoint.replace(/\/+$/, "")}/openai/deployments`,
    defaultQuery: { "api-version": apiVersion },
    defaultHeaders: { "api-key": apiKey },
  });
}

async function generateVisionOutput(input: GenerateRequest): Promise<VisionOutput> {
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!deployment) throw new VisionError("AZURE_OPENAI_DEPLOYMENT is required");

  const client = getAzureClient();
  const imageBase64 = normalizeBase64(input.imageBase64);

  const response = await client.chat.completions.create(
    {
      model: deployment,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" },
            },
            { type: "text", text: buildUserMessage(input) },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 6144,
    },
    { path: `/${deployment}/chat/completions` },
  );

  const text = response.choices[0]?.message?.content;
  if (!text) throw new VisionError("Azure GPT-5.1 returned an empty response");

  try {
    return visionOutputSchema.parse(JSON.parse(text));
  } catch (error) {
    throw new VisionError(error instanceof Error ? error.message : "Invalid Azure response");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BFL EU image generation (optional hero scenes — flux-dev)
// Currently unused in v1 since all visuals are procedural primitives, but the
// path is wired for future word-problem hero scenes.
// ─────────────────────────────────────────────────────────────────────────────

const bflSubmitSchema = z.object({
  id: z.string().min(1),
  polling_url: z.string().url(),
});

const bflResultSchema = z.object({
  status: z.string(),
  result: z
    .object({ sample: z.string().url() })
    .partial()
    .optional()
    .nullable(),
});

async function generateHeroScene(prompt: string): Promise<Buffer> {
  const apiKey = process.env.BFL_API_KEY;
  const baseUrl = process.env.BFL_BASE_URL ?? "https://api.eu.bfl.ai";
  if (!apiKey) throw new ImageEditError("BFL_API_KEY is required");

  const submit = await fetch(`${baseUrl.replace(/\/+$/, "")}/v1/flux-dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-key": apiKey },
    body: JSON.stringify({ prompt, width: 1024, height: 1024 }),
  });
  if (!submit.ok) throw new ImageEditError(`BFL submit failed: ${submit.status}`);
  const submitted = bflSubmitSchema.parse(await submit.json());

  let resultUrl: string | undefined;
  for (let i = 0; i < 30; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const poll = await fetch(submitted.polling_url, { headers: { "x-key": apiKey } });
    if (!poll.ok) continue;
    const polled = bflResultSchema.parse(await poll.json());
    if (polled.status === "Ready" && polled.result?.sample) {
      resultUrl = polled.result.sample;
      break;
    }
    if (polled.status === "Failed" || polled.status === "Error") {
      throw new ImageEditError(`BFL generation failed: ${polled.status}`);
    }
  }
  if (!resultUrl) throw new ImageEditError("BFL generation timed out");

  const imageResponse = await fetch(resultUrl);
  if (!imageResponse.ok) {
    throw new ImageEditError(`Failed to fetch generated image: ${imageResponse.status}`);
  }
  return Buffer.from(await imageResponse.arrayBuffer());
}

// ─────────────────────────────────────────────────────────────────────────────
// Local storage on Radom/Hermes (replaces R2)
// Files served by nginx at $STORAGE_PUBLIC_URL
// ─────────────────────────────────────────────────────────────────────────────

function getStoragePath() {
  const path = process.env.STORAGE_PATH;
  if (!path) throw new ImageEditError("STORAGE_PATH is required");
  return path;
}

function getStoragePublicUrl(key: string) {
  const publicUrl = process.env.STORAGE_PUBLIC_URL;
  if (!publicUrl) throw new ImageEditError("STORAGE_PUBLIC_URL is required");
  return `${publicUrl.replace(/\/+$/, "")}/${key}`;
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function storeHeroScene(prompt: string): Promise<string> {
  const storagePath = getStoragePath();
  const scenesDir = join(storagePath, "scenes");
  await mkdir(scenesDir, { recursive: true });

  const hash = createHash("sha256").update(prompt).digest("hex");
  const key = `scenes/${hash}.png`;
  const fullPath = join(storagePath, key);

  if (await fileExists(fullPath)) {
    return getStoragePublicUrl(key);
  }

  const buffer = await generateHeroScene(prompt);
  await writeFile(fullPath, buffer);
  return getStoragePublicUrl(key);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quota helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildQuotaExceededResponse(
  vision: VisionOutput,
  quota: UsageQuota,
): QuotaExceededResponse {
  return {
    error: "QUOTA_EXCEEDED",
    exercises: vision.exercises.map(toExerciseResponse),
    subject: vision.subject,
    topic: vision.topic,
    quota,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

router.post("/generate", async (req, res) => {
  const startedAt = Date.now();
  const parsed = generateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "imageBase64 and appUserId are required" });
    return;
  }

  const input = parsed.data;

  try {
    const quotaBefore = await getUsageQuota(input.appUserId);
    const remainingBefore = Math.max(0, quotaBefore.limit - quotaBefore.used);

    const vision = await generateVisionOutput(input);

    // Reserve one quota slot per worksheet (regardless of exercise count — the
    // unit-economics tier is worksheets/month, not exercises/month).
    if (remainingBefore <= 0) {
      res.status(402).json(buildQuotaExceededResponse(vision, quotaBefore));
      return;
    }

    const reservation = await reserveImageQuota(input.appUserId, 1);
    if (!reservation.allowed) {
      throw new QuotaExceededError("Worksheet quota exceeded");
    }

    const exercises = vision.exercises.map(toExerciseResponse);
    const durationMs = Date.now() - startedAt;

    req.log.info(
      {
        appUserId: input.appUserId,
        exerciseCount: exercises.length,
        visualCount: exercises.filter((e) => e.visual).length,
        durationMs,
      },
      "Generated worksheet",
    );

    const response: GenerateResponse = {
      exercises,
      subject: vision.subject,
      topic: vision.topic,
      quota: reservation.quota,
    };
    res.json(response);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      try {
        const vision = await generateVisionOutput(input);
        const quota = await getUsageQuota(input.appUserId);
        res.status(402).json(buildQuotaExceededResponse(vision, quota));
      } catch (fallbackError) {
        req.log.error({ error: fallbackError }, "Failed to build quota fallback");
        const quota = await getUsageQuota(input.appUserId);
        res.status(402).json({ error: "QUOTA_EXCEEDED", quota });
      }
      return;
    }

    req.log.error({ error }, "Worksheet generation failed");
    res.status(500).json({ error: "Worksheet generation failed" });
  }
});

// Optional: dedicated endpoint for generating a word-problem hero scene on demand.
// Mobile calls this lazily when an exercise has a heroScenePrompt the user wants to view.
router.post("/scene", async (req, res) => {
  const schema = z.object({
    prompt: z.string().min(1).max(500),
    appUserId: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "prompt and appUserId are required" });
    return;
  }

  try {
    const imageUrl = await storeHeroScene(parsed.data.prompt);
    res.json({ imageUrl });
  } catch (error) {
    req.log.error({ error }, "Scene generation failed");
    res.status(500).json({ error: "Scene generation failed" });
  }
});

export default router;
